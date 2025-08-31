from flask import Flask, request, jsonify, render_template, send_file
import os
import uuid
import sys
import logging
from werkzeug.utils import secure_filename

# Add the current directory to the path to import smart_cp_generator
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['GENERATED_FOLDER'] = 'generated'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['GENERATED_FOLDER'], exist_ok=True)

ALLOWED_EXTENSIONS = {'docx'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    # Import here to avoid circular imports
    from smart_cp_generator import process_documents, read_document
    
    # Check if files are present
    if 'baseCP' not in request.files or 'recap' not in request.files:
        return jsonify({'error': 'Both Base CP and Recap files are required'}), 400
    
    base_cp_file = request.files['baseCP']
    recap_file = request.files['recap']
    
    # Check if files are selected
    if base_cp_file.filename == '' or recap_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not (allowed_file(base_cp_file.filename) and allowed_file(recap_file.filename)):
        return jsonify({'error': 'Only DOCX files are allowed'}), 400
    
    # Generate unique IDs for this processing session
    session_id = str(uuid.uuid4())
    base_cp_filename = secure_filename(f"{session_id}_{base_cp_file.filename}")
    recap_filename = secure_filename(f"{session_id}_{recap_file.filename}")
    
    # Save files
    base_cp_path = os.path.join(app.config['UPLOAD_FOLDER'], base_cp_filename)
    recap_path = os.path.join(app.config['UPLOAD_FOLDER'], recap_filename)
    
    base_cp_file.save(base_cp_path)
    recap_file.save(recap_path)
    
    try:
        # Process documents
        output_filename = f"Final_Working_CP_{session_id}.docx"
        output_path = os.path.join(app.config['GENERATED_FOLDER'], output_filename)
        
        # Process the documents
        success, changes = process_documents(base_cp_path, recap_path, output_path)
        
        if success:
            return jsonify({
                'success': True,
                'download_url': f'/download/{output_filename}',
                'preview_url': f'/preview/{output_filename}',
                'filename': output_filename,
                'changes': changes.get('replacements', []) if changes else []
            })
        else:
            return jsonify({'error': 'Failed to process documents'}), 500
            
    except Exception as e:
        logger.error(f"Processing error: {e}")
        return jsonify({'error': f'Processing error: {str(e)}'}), 500
        
    finally:
        # Clean up uploaded files
        try:
            os.remove(base_cp_path)
            os.remove(recap_path)
        except Exception as e:
            logger.warning(f"Could not clean up files: {e}")

@app.route('/download/<filename>')
def download_file(filename):
    file_path = os.path.join(app.config['GENERATED_FOLDER'], filename)
    
    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return jsonify({'error': 'File not found'}), 404

@app.route('/preview/<filename>')
def preview_file(filename):
    """Serve file for preview (no download attachment)"""
    file_path = os.path.join(app.config['GENERATED_FOLDER'], filename)
    
    if os.path.exists(file_path):
        return send_file(file_path, mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    else:
        return jsonify({'error': 'File not found'}), 404

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    logger.info("Starting Smart CP Generator server")
    app.run(debug=True, host='0.0.0.0', port=5000)