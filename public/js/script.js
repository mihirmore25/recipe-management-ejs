console.log("Script is loaded successfully...");

window.onload = function () {
    const successMessage = document.getElementById("successMsg");
    console.log(successMessage);

    if (successMessage && successMessage.textContent.trim() !== "") {
        setTimeout(() => {
            successMessage.style.display = "none";
            successMessage.remove();
        }, 3000);
    }

    const errorMessage = document.getElementById("errorMsg");
    console.log(errorMessage);

    if (errorMessage && errorMessage.textContent.trim() !== "") {
        setTimeout(() => {
            errorMessage.style.display = "none";
            errorMessage.remove();
        }, 3000);
    }

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

    // Preview new image after uploading new image while updating recipe image
    const recipeImage = document.getElementById("recipeImage");
    console.log(recipeImage);

    recipeImage.addEventListener("change", function (event) {
        console.log(event.target.files);

        const file = event.target.files[0];
        console.log(`Image File ----> `, file);

        if (file) {
            // Update image preview
            const previewImage = document.getElementById("preview-img");
            console.log(previewImage);

            previewImage.src = URL.createObjectURL(file);
            console.log(previewImage.src);

            previewImage.onload = () => URL.revokeObjectURL(previewImage.src); // Free memory
        }
    });

    document.addEventListener("DOMContentLoaded", function () {
        const navbar = document.querySelector(".navbar");

        window.addEventListener("scroll", function () {
            if (window.scrollY > 50) {
                navbar.classList.add("fixed"); // Make it fixed & transparent
            } else {
                navbar.classList.remove("fixed"); // Make it normal
            }
        });
    });
};
