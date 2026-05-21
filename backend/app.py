import os
import sys
import cv2
import numpy as np
import joblib
import base64
import traceback

from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# Updated model paths
CNN_PATH = os.path.join(
    MODEL_DIR,
    "mobilenet_feature_extractor.h5"
)

RF_PATH = os.path.join(
    MODEL_DIR,
    "rf_model.pkl"
)

LABEL_PATH = os.path.join(
    MODEL_DIR,
    "label_map.pkl"
)

# Updated image size
IMG_SIZE = 150

# ROI settings
ROI_TOP = 0.20833333333333334
ROI_BOTTOM = 0.8333333333333334
ROI_LEFT = 0.46875
ROI_RIGHT = 0.9375

# Hugging Face port
PORT = int(
    os.environ.get(
        "PORT",
        7860
    )
)
# ============================================================

app = Flask(__name__)
CORS(app)

print(f"[startup] file: {os.path.abspath(__file__)}")
print(f"[startup] python: {sys.executable}")
print("[startup] loading models...")

# ============================================================
# LOAD MODELS
# ============================================================
try:
    # FIXED: compile=False
    cnn_model = load_model(
        CNN_PATH,
        compile=False
    )

    rf_model = joblib.load(
        RF_PATH
    )

    label_map = joblib.load(
        LABEL_PATH
    )

    idx_to_label = {
        v: k for k, v in label_map.items()
    }

    print(
        "[startup] models loaded successfully"
    )

    print(
        f"[startup] classes: {idx_to_label}"
    )

except Exception as e:
    print(
        "[ERROR] model loading failed:"
    )
    print(str(e))

    cnn_model = None
    rf_model = None
    label_map = {}
    idx_to_label = {}

# ============================================================
# IMAGE PREPROCESSING
# ============================================================
def preprocess_frame(img_array):
    h, w = img_array.shape[:2]

    top = int(h * ROI_TOP)
    bottom = int(h * ROI_BOTTOM)
    left = int(w * ROI_LEFT)
    right = int(w * ROI_RIGHT)

    roi = img_array[
        top:bottom,
        left:right
    ]

    rgb = cv2.cvtColor(
        roi,
        cv2.COLOR_BGR2RGB
    )

    resized = cv2.resize(
        rgb,
        (IMG_SIZE, IMG_SIZE)
    )

    processed = preprocess_input(
        resized.astype("float32")
    )

    return processed.reshape(
        1,
        IMG_SIZE,
        IMG_SIZE,
        3
    )

# ============================================================
# HEALTH ROUTES
# ============================================================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "running",
        "message": "AuslanAI API is live 🚀"
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "classes": idx_to_label
    })


# ============================================================
# PREDICT ROUTE
# ============================================================
@app.route("/predict", methods=["POST"])
def predict():
    try:
        if cnn_model is None or rf_model is None:
            return jsonify({
                "error": "Models not loaded"
            }), 500

        data = request.get_json()

        if not data or "image" not in data:
            return jsonify({
                "error": "No image provided"
            }), 400

        img_data = data["image"]

        # Remove base64 prefix
        if "," in img_data:
            img_data = img_data.split(",")[1]

        # Decode image
        img_bytes = base64.b64decode(
            img_data
        )

        img_array = np.frombuffer(
            img_bytes,
            dtype=np.uint8
        )

        img = cv2.imdecode(
            img_array,
            cv2.IMREAD_COLOR
        )

        if img is None:
            return jsonify({
                "error": "Invalid image"
            }), 400

        # Mirror image
        img = cv2.flip(
            img,
            1
        )

        # Preprocess
        processed = preprocess_frame(
            img
        )

        # CNN features
        features = cnn_model.predict(
            processed,
            verbose=0
        )

        # RF prediction
        pred_idx = rf_model.predict(
            features
        )[0]

        probs = rf_model.predict_proba(
            features
        )[0]

        confidence = float(
            probs[pred_idx] * 100
        )

        gesture = idx_to_label.get(
            pred_idx,
            "unknown"
        )

        return jsonify({
            "gesture": gesture,
            "confidence": round(
                confidence,
                2
            ),
            "all_probs": {
                idx_to_label.get(
                    i,
                    str(i)
                ): round(
                    float(p * 100),
                    2
                )
                for i, p in enumerate(
                    probs
                )
            }
        })

    except Exception as e:
        traceback.print_exc()

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# RUN APP
# ============================================================
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=PORT,
        debug=False
    )