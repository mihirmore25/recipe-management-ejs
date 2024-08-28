const successMessage = document.getElementById("successMsg");
console.log(successMessage);
setTimeout(() => {
    successMessage.style.display = "none";
    successMessage.remove();
}, 2000);

const errorMessage = document.getElementById("errorMsg");
console.log(errorMessage);

setTimeout(() => {
    errorMessage.style.display = "none";
    errorMessage.remove();
}, 2000);
