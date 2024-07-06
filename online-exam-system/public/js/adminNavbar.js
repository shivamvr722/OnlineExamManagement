//profile photo
let card = document.querySelector(".logout-navigate"); //declearing profile card element
let displayPicture = document.querySelector(".display-picture"); //declearing profile picture

displayPicture.addEventListener("click", function () {
  card.classList.toggle("hidden")
});

const displayTime = document.querySelector(".display-time");
function showTime() {
  let time = new Date();
  displayTime.innerText = time.toLocaleString({ hour12: true }).toUpperCase();
  setTimeout(showTime, 1000);
}

showTime();

