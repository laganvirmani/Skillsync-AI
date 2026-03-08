from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import random
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
REPORT_FOLDER = "reports"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# ============================
# GLOBAL VARIABLES
# ============================

question_pool = []
interview_results = []


# ============================
# STATIC QUESTION BANK
# ============================

QUESTION_BANK = [

# General
"Tell me about yourself.",
"What are your strengths?",
"What is your biggest weakness?",
"Why do you want this job?",
"Where do you see yourself in five years?",

# Programming
"What programming languages are you most comfortable with?",
"Explain Object Oriented Programming.",
"What is the difference between list and tuple in Python?",
"What is debugging?",
"What is a REST API?",

# Web Development
"What is HTML used for?",
"What is CSS used for?",
"What is JavaScript used for?",
"What is responsive web design?",
"What is the role of a backend server?",

# Python
"What is Flask used for?",
"What are Python decorators?",
"What is exception handling in Python?",
"What is a virtual environment in Python?",
"What is the difference between list and dictionary?",

# Projects
"Explain a project you have worked on.",
"What technologies did you use in your project?",
"What challenges did you face in your project?",
"How did you debug issues in your project?",
"What improvements would you make in your project?",

# Problem solving
"How do you approach solving a programming problem?",
"What tools do you use for debugging?",
"Explain a difficult bug you solved.",
"How do you optimize code performance?",
"What is time complexity?"

]


# ============================
# HOME ROUTE
# ============================

@app.route("/")
def home():
    return jsonify({"message": "AI Mock Interview API Running"})


# ============================
# RESUME UPLOAD
# ============================

@app.route("/api/upload", methods=["POST"])
def upload_resume():

    global question_pool

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)

    file.save(filepath)

    # simple random resume score
    resume_score = random.randint(70, 95)

    # shuffle questions for interview
    question_pool = QUESTION_BANK.copy()
    random.shuffle(question_pool)

    return jsonify({
        "resume_score": resume_score,
        "message": "Resume uploaded and analyzed"
    })


# ============================
# GENERATE INTERVIEW QUESTION
# ============================

@app.route("/api/generate-question", methods=["POST"])
def generate_question():

    global question_pool

    if len(question_pool) == 0:
        question_pool = QUESTION_BANK.copy()
        random.shuffle(question_pool)

    question = question_pool.pop()

    return jsonify({
        "question": question
    })


# ============================
# VOICE CONFIDENCE ANALYSIS
# ============================

@app.route("/api/analyze-voice", methods=["POST"])
def analyze_voice():

    confidence = random.randint(60, 100)

    return jsonify({
        "confidence_score": confidence
    })


# ============================
# SAVE INTERVIEW RESULT
# ============================

@app.route("/api/save-result", methods=["POST"])
def save_result():

    data = request.json

    interview_results.append(data)

    return jsonify({"message": "Result saved"})


# ============================
# DOWNLOAD REPORT
# ============================

@app.route("/api/download-report", methods=["GET"])
def download_report():

    report_data = {
        "date": str(datetime.now()),
        "results": interview_results
    }

    filename = f"report_{datetime.now().strftime('%Y%m%d%H%M%S')}.json"

    filepath = os.path.join(REPORT_FOLDER, filename)

    with open(filepath, "w") as f:
        json.dump(report_data, f, indent=4)

    return send_file(filepath, as_attachment=True)


# ============================
# HEALTH CHECK
# ============================

@app.route("/api/health")
def health():
    return jsonify({"status": "server running"})


# ============================
# RUN SERVER
# ============================

if __name__ == "__main__":
    app.run(debug=True)