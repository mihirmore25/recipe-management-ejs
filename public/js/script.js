const successMessage = document.getElementById("successMsg");
console.log(successMessage);
setTimeout(() => {
    successMessage.style.display = "none";
    successMessage.remove();
}, 3000);

const errorMessage = document.getElementById("errorMsg");
console.log(errorMessage);

setTimeout(() => {
    errorMessage.style.display = "none";
    errorMessage.remove();
}, 3000);

let addIngredientsBtn = document.getElementById("addIngredientsBtn");
let addInstructionsBtn = document.getElementById("addInstructionsBtn");
let instructionList = document.querySelector(".instructionList");
let ingredientList = document.querySelector(".ingredientList");
let ingredientDiv = document.querySelectorAll(".ingredientDiv")[0];
let instructionDiv = document.querySelectorAll(".instructionDiv")[0];

addIngredientsBtn.addEventListener("click", function () {
    let newIngredients = ingredientDiv.cloneNode(true);
    let input = newIngredients.getElementsByTagName("input")[0];
    input.value = "";
    ingredientList.appendChild(newIngredients);
    console.log("Ingredients Button Clicked");
});

addInstructionsBtn.addEventListener("click", function () {
    let newInstructions = instructionDiv.cloneNode(true);
    let input = newInstructions.getElementsByTagName("input")[0];
    input.value = "";
    instructionList.appendChild(newInstructions);
    console.log("Instructions Button Clicked");
});
