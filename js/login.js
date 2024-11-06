const form = document.getElementById("loginForm");

form.addEventListener("submit", function(event) {
    event.preventDefault(); 
    window.location.href = "../pages/mainlogeado.html";  
});