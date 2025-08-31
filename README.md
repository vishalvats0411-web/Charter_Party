🚢 Smart Charter Party Generator

An AI-powered web application for generating accurate Charter Party (CP) documents by combining a base CP with fixture recap details — ensuring correct formatting, clause mapping, and consistency.

📖 Project Overview

The Smart CP Generator is designed to assist maritime professionals in automating CP generation. It leverages Google’s Gemini API for intelligent document analysis and processing while maintaining the exact formatting of the base CP.

🔧 Architecture

Frontend (index.html) – Responsive web interface with drag-and-drop uploads, progress tracking, and change visualization.

Backend (app.py) – Flask server for handling file uploads, AI processing, and file downloads.

Core Logic (smart_cp_generator.py) – AI-powered document analysis, smart text replacement, and recap integration.

🔑 Key Features

AI Integration – Uses Gemini 1.5 Pro for intelligent document analysis.

Multi-format Support – Works with both DOCX and PDF documents.

Smart Text Replacement – Automatically maps recap terms to base CP clauses.

Robust Error Handling – Fallback processing when AI fails.

Secure Processing – File validation, size limits, and safe handling.

Optimized Performance – Handles large documents with retry logic.

🚀 Getting Started
1️⃣ Installation

Clone the repo:

git clone https://github.com/Ayush-Rawat-9/Smart-CP-Generator.git
cd Smart-CP-Generator


Install dependencies:

pip install flask python-docx PyMuPDF requests

2️⃣ Configuration

Set your Google Gemini API key in smart_cp_generator.py.

Create required directories:

mkdir uploads generated

3️⃣ Run the Application
python app.py


Open your browser and visit:
👉 http://localhost:5000

📂 Project Structure
Smart-CP-Generator/
│── app.py                 # Flask backend
│── smart_cp_generator.py  # AI-powered document processing logic
│── templates/
│    └── index.html        # Frontend interface
│── uploads/               # Uploaded documents
│── generated/             # Processed CP outputs
│── requirements.txt       # Dependencies

🛠️ Troubleshooting

AI Errors: If Gemini fails, fallback logic ensures processing continues.

File Issues: Ensure DOCX/PDF files are properly formatted before upload.

Performance: Large files may take longer, but retry logic prevents failures.
