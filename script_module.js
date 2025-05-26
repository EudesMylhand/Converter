
    document.addEventListener('DOMContentLoaded', function() {
        // Éléments du DOM
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const convertBtn = document.getElementById('convert-btn');
        const downloadBtn = document.getElementById('download-btn');
        const resultsDiv = document.getElementById('results');
        const previewDiv = document.getElementById('preview');
        const fileInfoDiv = document.getElementById('file-info');
        const statusDiv = document.getElementById('status');
        
        // Variables d'état
        let currentFile = null;
        let csvContent = '';
        
        // Gestion du drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            dropZone.classList.add('highlight');
        }
        
        function unhighlight() {
            dropZone.classList.remove('highlight');
        }
        
        dropZone.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }
        
        // Gestion de la sélection de fichier
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                handleFiles(this.files);
            }
        });
        
        function handleFiles(files) {
            const file = files[0];
            
            // Vérification du type de fichier
            if (!file.name.endsWith('.txt') && !file.type.match('text.*')) {
                showStatus('Veuillez sélectionner un fichier texte (.txt)', 'error');
                return;
            }
            
            currentFile = file;
            
            // Lecture du fichier
            const reader = new FileReader();
            
            reader.onload = function(e) {
                fileInfoDiv.innerHTML = `
                    <p><strong>Fichier:</strong> ${file.name}</p>
                    <p><strong>Taille:</strong> ${formatFileSize(file.size)}</p>
                `;
                
                convertBtn.disabled = false;
                showStatus('Fichier prêt pour la conversion', 'success');
            };
            
            reader.onerror = function() {
                showStatus('Erreur lors de la lecture du fichier', 'error');
            };
            
            reader.readAsText(file);
        }
        
        // Conversion en CSV
        convertBtn.addEventListener('click', function() {
            if (!currentFile) {
                showStatus('Aucun fichier sélectionné', 'error');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const textContent = e.target.result;
                    const outputDelimiter = document.getElementById('delimiter').value;
                    const inputDelimiter = document.getElementById('input-delimiter').value;
                    const hasHeader = document.getElementById('has-header').checked;
                    
                    // Conversion
                    csvContent = convertToCSV(
                        textContent, 
                        inputDelimiter, 
                        outputDelimiter, 
                        hasHeader
                    );
                    
                    // Affichage du résultat
                    showPreview(csvContent);
                    resultsDiv.classList.remove('hidden');
                    showStatus('Conversion réussie!', 'success');
                } catch (error) {
                    showStatus('Erreur de conversion: ' + error.message, 'error');
                    console.error(error);
                }
            };
            
            reader.readAsText(currentFile);
        });
        
        // Téléchargement du CSV
        downloadBtn.addEventListener('click', function() {
            if (!csvContent) return;
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.setAttribute('href', url);
            link.setAttribute('download', currentFile.name.replace('.txt', '.csv') || 'converted.csv');
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
        
        // Fonction de conversion
        function convertToCSV(text, inputDelimiter, outputDelimiter, hasHeader) {
            // Gestion des séparateurs spéciaux
            if (inputDelimiter === '\\t') inputDelimiter = '\t';
            if (outputDelimiter === '\\t') outputDelimiter = '\t';
            
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            
            if (lines.length === 0) {
                throw new Error('Le fichier est vide');
            }
            
            const csvLines = [];
            
            // Traitement ligne par ligne
            lines.forEach((line, index) => {
                // Séparation des colonnes
                let columns;
                
                if (inputDelimiter === ' ') {
                    // Pour les espaces, on split sur les espaces multiples
                    columns = line.split(/\s+/);
                } else {
                    columns = line.split(inputDelimiter);
                }
                
                // Nettoyage des colonnes
                columns = columns.map(col => col.trim());
                
                // Ajout au CSV
                if (index === 0 && hasHeader) {
                    // Première ligne comme en-tête
                    csvLines.push(columns.join(outputDelimiter));
                } else {
                    // Ligne de données
                    csvLines.push(columns.join(outputDelimiter));
                }
            });
            
            return csvLines.join('\n');
        }
        
        // Affichage de l'aperçu
        function showPreview(csv) {
            const lines = csv.split('\n');
            const outputDelimiter = document.getElementById('delimiter').value;
            const hasHeader = document.getElementById('has-header').checked;
            
            let tableHtml = '<table>';
            
            // Limiter à 10 lignes pour l'aperçu
            const previewLines = lines.slice(0, 10);
            
            previewLines.forEach((line, index) => {
                const cells = line.split(outputDelimiter);
                
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    if (index === 0 && hasHeader) {
                        tableHtml += `<th>${cell}</th>`;
                    } else {
                        tableHtml += `<td>${cell}</td>`;
                    }
                });
                tableHtml += '</tr>';
            });
            
            tableHtml += '</table>';
            
            if (lines.length > 10) {
                tableHtml += `<p class="more-lines">... et ${lines.length - 10} lignes supplémentaires</p>`;
            }
            
            previewDiv.innerHTML = tableHtml;
        }
        
        // Affichage des messages de statut
        function showStatus(message, type) {
            statusDiv.textContent = message;
            statusDiv.className = type;
        }
        
        // Formatage de la taille du fichier
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    });
