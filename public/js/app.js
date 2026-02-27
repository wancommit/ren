document.querySelector('form').addEventListener('submit', function(e) {
    const overlay = document.getElementById('loading-overlay');
    const bar = document.getElementById('loading-bar');
    
    // Show the overlay
    overlay.classList.remove('d-none');
    
    // Animate the bar (Simulating the "Upload")
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width += 10;
            bar.style.width = width + '%';
        }
    }, 50);
});