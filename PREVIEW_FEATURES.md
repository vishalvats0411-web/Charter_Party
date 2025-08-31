# Document Preview & Editing Features

The Smart CP Generator now includes advanced document preview and editing capabilities, similar to the smart-cp-preview.zip project.

## Features Added

### 1. Document Preview
- **Real-time Preview**: View generated Charter Party documents directly in the browser
- **Side-by-side View**: Compare original and editable versions simultaneously
- **Toggle View Mode**: Switch between side-by-side and single-panel views

### 2. Inline Document Editing
- **Click to Edit**: Click on any paragraph, heading, or table cell to edit
- **Change Tracking**: Visual indicators show which sections have been modified
- **Real-time Updates**: See changes as you type with immediate feedback

### 3. Document Export
- **Download Edited**: Export your edited document as a new DOCX file
- **Format Preservation**: Maintains document structure and formatting
- **Clean Export**: Removes editing indicators for professional output

### 4. User Experience
- **Intuitive Interface**: Clean, modern design with Bootstrap styling
- **Responsive Layout**: Works on desktop and mobile devices
- **Error Handling**: Graceful fallbacks when libraries fail to load

## Technical Implementation

### Libraries Used
- **Mammoth.js**: Converts DOCX files to HTML for preview
- **DOMPurify**: Sanitizes HTML content for security
- **HTMLtoDOCX**: Converts edited HTML back to DOCX format

### How It Works
1. **Document Loading**: DOCX files are fetched and converted to HTML using Mammoth
2. **HTML Preparation**: Content is sanitized and made editable with unique IDs
3. **Change Tracking**: Modifications are tracked by comparing original vs. edited text
4. **Export Process**: Clean HTML is converted back to DOCX for download

### File Structure
- `app.py`: Added `/preview/<filename>` route for document serving
- `templates/index.html`: Enhanced with preview UI and JavaScript functionality
- Preview section includes original/editable views with editing controls

## Usage Instructions

### 1. Generate Document
- Upload Base CP and Recap documents
- Process to generate Charter Party
- Click "Preview Document" button

### 2. Edit Document
- Click on any text to make it editable
- Make your changes
- Modified sections are highlighted with orange borders

### 3. Save & Export
- Use "Save Edits" to preserve changes in session
- Use "Discard Edits" to revert to original
- Use "Download Edited" to get your modified document

### 4. View Modes
- **Side by Side**: Original and editable views side-by-side
- **Toggle**: Switch between original and editable views

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **JavaScript Required**: All preview functionality requires JavaScript
- **File API Support**: Uses modern browser File API for document handling

## Security Features

- **HTML Sanitization**: All content is sanitized using DOMPurify
- **Content Security**: Prevents XSS attacks from document content
- **File Validation**: Only DOCX files are accepted and processed

## Future Enhancements

- **Collaborative Editing**: Real-time multi-user editing
- **Version History**: Track document versions and changes
- **Template Library**: Pre-built Charter Party templates
- **Advanced Formatting**: Rich text editor with formatting options
- **Comment System**: Add comments and annotations to documents

## Troubleshooting

### Common Issues
1. **Libraries Not Loading**: Refresh the page if you see library errors
2. **Document Won't Load**: Check file format (must be DOCX)
3. **Editing Not Working**: Ensure JavaScript is enabled
4. **Download Fails**: Check browser download settings

### Performance Notes
- Large documents (>10MB) may take longer to load
- Editing performance depends on document complexity
- Browser memory usage increases with document size
