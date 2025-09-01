import { PageLoader } from "./pageLoader.js";

$(document).ready(function() {
    
    PageLoader.init();
    
    async function resizeAndConvertToBase64(file, maxSize, quality) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
    
            reader.onload = (e) => {
                img.src = e.target.result;
    
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
    
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxSize) {
                            height = Math.round((height * maxSize) / width);
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = Math.round((width * maxSize) / height);
                            height = maxSize;
                        }
                    }
    
                    canvas.width = width;
                    canvas.height = height;
    
                    ctx.drawImage(img, 0, 0, width, height);
    
                    const base64String = canvas.toDataURL('image/jpeg', quality);
                    resolve(base64String);
    
                    URL.revokeObjectURL(img.src);
                };
    
                img.onerror = () => {
                    reject(new Error('Failed to load image'));
                };
            };
    
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
    
            reader.readAsDataURL(file);
        });
    }
});