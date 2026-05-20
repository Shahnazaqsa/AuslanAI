import os
import sys
import cv2
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import base64
import traceback

# ============================================================
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR  = os.path.join(BASE_DIR, "models")
CNN_PATH   = os.path.join(MODEL_DIR, "mobilenet_feature_extractor.keras")
RF_PATH    = os.path.join(MODEL_DIR, "rf_model.pkl")
LABEL_PATH = os.path.join(MODEL_DIR, "label_map.pkl")

IMG_SIZE   = 224
ROI_TOP    = 0.20833333333333334
ROI_BOTTOM = 0.8333333333333334
ROI_LEFT   = 0.46875
ROI_RIGHT  = 0.9375
PORT       = 5000
# ============================================================

app = Flask(__name__)
CORS(app)

print(f"[startup] running backend from {os.path.abspath(__file__)}")
print(f"[startup] python executable {sys.executable}")
print("Loading models...")

cnn_model = load_model(CNN_PATH)
rf_model  = joblib.load(RF_PATH)
label_map = joblib.load(LABEL_PATH)

idx_to_label = {v: k for k, v in label_map.items()}

print(f"Models ready! Classes: {idx_to_label}")


def preprocess_frame(img_array):
    # ROI crop same as frontend guide
    h, w = img_array.shape[:2]

    top    = int(h * ROI_TOP)
    bottom = int(h * ROI_BOTTOM)
    left   = int(w * ROI_LEFT)
    right  = int(w * ROI_RIGHT)

    roi = img_array[top:bottom, left:right]

    print(f"[predict] frame={w}x{h} crop={left}:{right} x {top}:{bottom} -> {roi.shape}")

    rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (IMG_SIZE, IMG_SIZE))

    preprocessed = preprocess_input(
        resized.astype("float32")
    )

    return preprocessed.reshape(1, IMG_SIZE, IMG_SIZE, 3)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "classes": idx_to_label
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        if not data or "image" not in data:
            return jsonify({
                "error": "No image provided"
            }), 400

        # Base64 decode
        img_data = data["image"]
        print(f"[predict] request received image len={len(img_data)}")

        if "," in img_data:
            img_data = img_data.split(",")[1]

        img_bytes = base64.b64decode(img_data)
        print(f"[predict] decoded bytes={len(img_bytes)}")

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

        # IMPORTANT FIX:
        # Flip image horizontally to match test script
        img = cv2.flip(img, 1)

        # Preprocess + Predict
        processed = preprocess_frame(img)

        print(
            f"[predict] processed shape={processed.shape} "
            f"dtype={processed.dtype}"
        )

        if processed.shape[1:] != (IMG_SIZE, IMG_SIZE, 3):
            return jsonify({
                "error":
                f"Wrong shape {processed.shape}, "
                f"expected (1,{IMG_SIZE},{IMG_SIZE},3)"
            }), 500

        features = cnn_model.predict(
            processed,
            verbose=0
        )

        pred_idx = rf_model.predict(features)[0]

        prob = rf_model.predict_proba(features)[0]

        confidence = float(
            prob[pred_idx] * 100
        )

        gesture = idx_to_label[pred_idx]

        return jsonify({
            "gesture": gesture,
            "confidence": round(confidence, 2),
            "all_probs": {
                idx_to_label[i]:
                round(float(p * 100), 2)
                for i, p in enumerate(prob)
            }
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": str(e)
        }), 500


if __name__ == "__main__":
    print(f"Flask API running on http://localhost:{PORT}")
    app.run(
        host="0.0.0.0",
        port=PORT,
        debug=False
    )