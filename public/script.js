document.addEventListener("DOMContentLoaded", (e) => {
    let btn = document.getElementById("editBtn");
    btn.addEventListener("click", (e) => {
        let rest = document.getElementById("restaurant");
        let title = document.getElementById("titleBox");
        let submit = document.getElementById("editSubmit");

        rest.setAttribute("class", "hidden");
        btn.setAttribute("class", "hidden");
        submit.removeAttribute("class", "hidden");
        let input = document.createElement('input');
        input.setAttribute("name", "name");
        title.appendChild(input);
        console.log("Works");
    })
})