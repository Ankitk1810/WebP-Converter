let droppedFiles = [];
let zipContent; // Store ZIP content for download

// Drag-and-Drop Event Listeners
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const btnContainer = document.getElementById('btn-container');
const loader = document.querySelector('.loader');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qualitySlider = document.getElementById('qualitySlider');
const successMessage = document.getElementById('successMessage');

dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (event) => {
    droppedFiles = Array.from(event.target.files);
    displayFileNames(droppedFiles);
    convertBtn.style.display = 'inline'; // Show convert button
    downloadBtn.style.display = 'none'; // Hide download button
});

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.style.backgroundColor = '#e7f0ff';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.backgroundColor = 'white';
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.style.backgroundColor = 'white';
    droppedFiles = Array.from(event.dataTransfer.files);
    displayFileNames(droppedFiles);
    convertBtn.style.display = 'inline'; // Show convert button
    downloadBtn.style.display = 'none'; // Hide download button
});

// Function to format file size to Bytes, KB, MB, GB or TB
function formatFileSize(size) {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    return (size / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}



function displayFileNames(files) {
    if (files && files.length > 0) {
        dropZone.style.display = 'none';
        btnContainer.style.display = 'flex';

    } else {
        btnContainer.style.display = 'none';
    }


    filePreviewContainer.innerHTML = ''; // Clear previous previews
    files.forEach((file, index) => {
        const fileDiv = document.createElement('div');
        fileDiv.classList.add('fileContainer');
        fileDiv.setAttribute('data-index', index);

        const fileName = document.createElement('p');
        fileName.textContent = file.name;
        fileName.className = 'fileName';

        const fileSize = document.createElement('p');
        fileSize.textContent = formatFileSize(file.size);
        fileSize.className = 'fileSize';

        const fileInfo = document.createElement('div');
        fileInfo.classList.add('fileInfo');
        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('removeBtn');
        removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>` // Cross symbol

        removeBtn.addEventListener('click', () => {
            filePreviewContainer.removeChild(fileDiv);
            droppedFiles.splice(index, 1); // Remove the file from the list
            if (droppedFiles.length === 0) {
                convertBtn.style.display = 'none'; // Hide button if no files
                downloadBtn.style.display = 'none'; // Hide download button
                dropZone.style.display = 'flex';
            } else {
                updateFileDivs(); // Update the indices for remaining files
            }
        });

        const progressContainer = document.createElement('div');
        progressContainer.classList.add('progressContainer');
        progressContainer.classList.add("ready");
        progressContainer.textContent = "Ready to Convert"

        fileDiv.appendChild(fileInfo);
        fileDiv.appendChild(removeBtn);
        fileDiv.appendChild(progressContainer);
        filePreviewContainer.appendChild(fileDiv);
    });
}

function updateFileDivs() {
    const fileDivs = filePreviewContainer.querySelectorAll('.fileContainer');
    fileDivs.forEach((fileDiv, index) => {
        fileDiv.setAttribute('data-index', index); // Update index for each remaining file
    });
}

function convertToWebP() {
    if (droppedFiles.length === 0) {
        alert('Please upload or drop at least one image.');
        return;
    }
    gsap.to(".btn-wrapper", {
        opacity: 0.8,
        y: 2,
        pointerEvents: 'none'
    })

    convertBtn.disabled = true; // Disable the convert button
    convertBtn.textContent = 'Converting...'; // Change button text
    const quality = qualitySlider.value / 100; // Get quality value
    const zip = new JSZip(); // Create a new ZIP instance
    const promises = []; // To hold all promises for each image conversion

    droppedFiles.forEach((file, index) => {
        const reader = new FileReader();

        const fileDiv = document.querySelector(`[data-index="${index}"]`);
        const progressContainer = fileDiv.querySelector('.progressContainer');
        progressContainer.classList.remove('ready');
        progressContainer.classList.add('processing');
        progressContainer.textContent = 'Converting...';

        const promise = new Promise((resolve, reject) => {  // resolve is needed here to signal promise completion
            reader.onload = function (event) {
                const img = new Image();
                img.src = event.target.result;

                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(function (blob) {

                        const fileName = file.name.split('.')[0] + `.webp`;
                        zip.file(fileName, blob); // Add WebP file to ZIP

                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.className = 'individiualDownloadLink';
                        downloadLink.download = fileName;
                        downloadLink.textContent = "Download"
                        downloadLink.style.display = 'block';

                        const fileDiv = document.querySelector(`.fileContainer[data-index="${index}"]`);
                        fileDiv.appendChild(downloadLink); // Append download link

                        progressContainer.classList.remove('processing');
                        progressContainer.classList.add('done');
                        progressContainer.textContent = 'Done';

                        resolve();  // Conversion is done, so resolve the promise

                    }, 'image/webp', quality); // Set quality for the output
                };
            };

            reader.onerror = function () {
                reject(new Error('Error reading the file.'));
            };

            reader.readAsDataURL(file); // Start reading the file

        });

        promises.push(promise); // Add promise to the array
    });



    Promise.all(promises).then(() => {
        gsap.to(convertBtn, {
            opacity: 0.6
        });
        zip.generateAsync({ type: 'blob' }).then(function (content) {
            const url = URL.createObjectURL(content);
            zipContent = content; // Store ZIP content
            downloadBtn.href = url;
            downloadBtn.download = 'converted_images.zip'; // Name of ZIP file
            downloadBtn.style.display = 'inline'; // Show download button
            downloadBtn.textContent = 'Download All';
            gsap.to(".btn-wrapper", {
                opacity: 1,
                y: 0,
                pointerEvents: 'all'
            })

            // Update button text and state
            convertBtn.disabled = false; // Enable the button again
            
        });
    }).catch((error) => {
        alert("Error during conversion");
        console.error("Error during conversion:", error);
        convertBtn.textContent = 'Convert to WebP'; // Reset button text in case of error
        convertBtn.disabled = false; // Enable button in case of error
    });

}

function downloadZip() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipContent); // Use stored ZIP content
    a.download = 'converted_images.zip';
    a.click();
}