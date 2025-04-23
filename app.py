import os
import glob
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.abspath(os.path.dirname(__file__))

# List all .pkl models in the root directory
def list_models():
    return [os.path.basename(f) for f in glob.glob(os.path.join(MODEL_DIR, '*.pkl'))]

@app.route('/models', methods=['GET'])
def get_models():
    models = list_models()
    return jsonify({'models': models})

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    features = data.get('features')
    model_name = data.get('model')
    if not features or not model_name:
        return jsonify({'error': 'Missing features or model'}), 400
    model_path = os.path.join(MODEL_DIR, model_name)
    if not os.path.isfile(model_path):
        return jsonify({'error': 'Model not found'}), 404
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        # Check if loaded object is a sklearn-like model
        if not hasattr(model, 'predict'):
            return jsonify({'error': 'Selected file is not a valid sklearn model. Please choose a valid model file.'}), 400
        # Features should be in the same order as model expects
        feature_order = [
            'basket_icon_click', 'basket_add_list', 'basket_add_detail', 'sort_by', 'image_picker',
            'promo_banner_click', 'list_size_dropdown', 'closed_minibasket_click', 'checked_delivery_detail',
            'checked_returns_detail', 'sign_in', 'saw_checkout', 'saw_homepage', 'device_mobile',
            'device_computer', 'device_tablet', 'returning_user'
        ]
        X = np.array([[features.get(f, 0) for f in feature_order]])
        pred = model.predict(X)[0]
        prob = None
        if hasattr(model, 'predict_proba'):
            prob = float(model.predict_proba(X)[0][1])
        result = {
            'prediction': 'Likely to Order' if pred == 1 else 'Not Likely to Order',
            'probability': prob
        }
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
