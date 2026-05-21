import tensorflow as tf

model = tf.keras.models.load_model(
    "mobilenet_feature_extractor.h5",
    compile=False
)

model.export("mobilenet_savedmodel")
print("Done!")