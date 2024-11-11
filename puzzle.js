document.addEventListener('DOMContentLoaded', (event) => {
    let map = L.map('map', {
        center: [53.33961821571435, 15.03743019084533],
        zoom: 13
    });

    L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    document.getElementById('locate').addEventListener('click', () => {
        map.locate({ setView: true, maxZoom: 16 });
    });

    map.on('locationfound', (e) => {
        L.marker(e.latlng).addTo(map)
            .bindPopup("You are here").openPopup();
    });

    map.on('locationerror', (e) => {
        alert(e.message);
    });

    document.getElementById('saveMap').addEventListener('click', function() {
        leafletImage(map, function(err, canvas) {
            if (err) {
                console.error('Błąd przy tworzeniu obrazu:', err);
                return;
            }

            const image = canvas.toDataURL('image/png');
            splitImage(image, 4, 4, canvas.width / 4, canvas.height / 4).then(imagePieces => {
                const puzzleContainer = document.getElementById('puzzle');
                puzzleContainer.innerHTML = ''; // Clear existing pieces

                imagePieces.forEach((piece, index) => {
                    const pieceDiv = document.createElement('div');
                    pieceDiv.className = 'puzzle-piece';
                    pieceDiv.draggable = true;
                    pieceDiv.ondragstart = (event) => {
                        event.dataTransfer.setData('text/plain', event.target.id);
                    };
                    pieceDiv.style.backgroundImage = `url(${piece})`;
                    pieceDiv.id = `piece-${index}`;
                    puzzleContainer.appendChild(pieceDiv);
                });

                // Add the original image back to the raster-image div
                const rasterImageContainer = document.getElementById('raster-image');
                rasterImageContainer.innerHTML = ''; // Clear existing image
                const originalImage = new Image();
                originalImage.src = image;
                rasterImageContainer.appendChild(originalImage);
            }).catch(error => {
                console.error(error);
            });
        });
    });

    const dropArea = document.getElementById('drop-area');
    dropArea.ondragover = (event) => {
        event.preventDefault();
    };

    // Create 16 divs inside drop-area
    for (let i = 0; i < 16; i++) {
        const dropDiv = document.createElement('div');
        dropDiv.className = 'drop-slot';
        dropDiv.id = `drop-slot-${i}`;
        dropDiv.ondragover = (event) => {
            event.preventDefault();
        };
        dropDiv.ondrop = (event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData('text/plain');
            const piece = document.getElementById(id);
            if (piece) {
                // Remove piece from previous slot if it was in the correct position
                const pieceIndex = parseInt(piece.id.split('-')[1], 10);
                if (correctPositions[pieceIndex]) {
                    correctPositions[pieceIndex] = false;
                    correctPieces--;
                }

                dropDiv.appendChild(piece);
                checkPiecePosition(piece, i);
                checkPuzzleCompletion();
            }
        };
        dropArea.appendChild(dropDiv);
    }
});

let correctPieces = 0;
const correctPositions = new Array(16).fill(false);

function splitImage(imageSrc, numColsToCut, numRowsToCut, widthOfOnePiece, heightOfOnePiece) {
    return new Promise((resolve, reject) => {
        var image = new Image();
        image.onload = function() {
            var imagePieces = [];
            for (var x = 0; x < numColsToCut; ++x) {
                for (var y = 0; y < numRowsToCut; ++y) {
                    var canvas = document.createElement('canvas');
                    canvas.width = widthOfOnePiece;
                    canvas.height = heightOfOnePiece;
                    var context = canvas.getContext('2d');
                    context.drawImage(image, x * widthOfOnePiece, y * heightOfOnePiece, widthOfOnePiece, heightOfOnePiece, 0, 0, canvas.width, canvas.height);
                    imagePieces.push(canvas.toDataURL());
                }
            }
            resolve(imagePieces);
        };
        image.onerror = function() {
            reject(new Error('Failed to load image'));
        };
        image.src = imageSrc;
    });
}

function checkPiecePosition(piece, slotIndex) {
    const pieceIndex = parseInt(piece.id.split('-')[1], 10);
    console.log(`Piece ${pieceIndex} dropped into slot ${slotIndex}.`);
    if (pieceIndex === slotIndex) {
        if (!correctPositions[slotIndex]) {
            correctPositions[slotIndex] = true;
            correctPieces++;
            console.log(`Piece ${slotIndex} is in the correct position.`);
        }
    } else {
        if (correctPositions[slotIndex]) {
            correctPositions[slotIndex] = false;
            correctPieces--;
            console.log(`Piece ${slotIndex} is not in the correct position.`);
        }
    }
}

function checkPuzzleCompletion() {
    if (correctPieces === 16) {
        alert('Puzzle ułożone poprawnie!');
    }
}