// --- Contact Form Logic ---
function handleContactForm(e) {
    e.preventDefault();
    const form = document.getElementById('contact-form');
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = 'Wysyłanie...';

    const templateParams = {
        name: form.querySelector('[name="name"]').value,
        company: form.querySelector('[name="company"]').value,
        email: form.querySelector('[name="email"]').value,
    };

    emailjs.send('service_f6jk09n', 'template_m3pvn2n', templateParams)
        .then(() => {
            form.style.display = 'none';
            document.getElementById('form-success').style.display = 'block';
        })
        .catch(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            alert('Wystąpił błąd. Prosimy skontaktować się bezpośrednio: jstrzemecka@blueaccelerator.com');
        });
}
