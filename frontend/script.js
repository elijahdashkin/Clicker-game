// Глобальные переменные
let money = 0;
let clickGain = 1;
let autoGain = 1;
let shopData = [];
let token = null;
let interval;

// Элементы DOM
const clickerButton = document.getElementById("main-clicker");
const moneyText = document.getElementById("money");
const shopButtons = [document.getElementById("b1"), document.getElementById("b2"), document.getElementById("b3")];
const authModal = document.getElementById("auth-modal");
const closeModal = document.querySelector(".close");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const authForm = document.getElementById("auth-form");

// Основные функции
function updateMoney(check = true) {
  moneyText.textContent = `${money} Руб`;
  if (check) checkPrices();
}

function autoMoney(amount) {
  clearInterval(interval);
  interval = setInterval(() => {
    money += autoGain;
    updateMoney();
    saveProgress();
  }, 1000 / amount);
}

function checkPrices() {
  for (let i = 0; i < shop.length; i++) {
    shop[i].element.disabled = money < shop[i].price;
  }
}

function onBuy(obj) {
  money -= obj.price;
  updateMoney(false);
  for (let i = 0; i < shop.length; i++) {
    shop[i].element.disabled = true;
  }
}

// Класс для элементов магазина
class ShopElement {
  constructor(id, newprice_func, onclick_func) {
    this.id = id;
    this.element = document.getElementById(id);
    this.element.onclick = this.purchase.bind(this);
    this.text_element = this.element.getElementsByTagName("b")[0];

    this._updatePrice = newprice_func;
    this._onClick = onclick_func;

    this.price = 0;
    this.purchaseLvl = 1;
    this.updatePrice();
  }

  onClick() {
    this._onClick(this);
  }

  updatePrice() {
    this._updatePrice(this);
  }

  updateText() {
    this.text_element.innerHTML = `<b>${this.price} Руб: </b>`;
  }

  update() {
    this.updatePrice();
    this.updateText();
  }

  purchase() {
    if (money >= this.price) {
      money -= this.price;
      this.purchaseLvl += 1;
      this.onClick();
      this.update();
      updateMoney();
      saveProgress();
    } else {
      alert("Недостаточно денег!");
    }
  }
}

// Функции для кнопок магазина
function newPrice1(obj) {
  obj.price = clickGain * 25 * obj.purchaseLvl;
}

function newPrice2(obj) {
  obj.price = 200 * obj.purchaseLvl;
}

function newPrice3(obj) {
  obj.price = autoGain * 30 * obj.purchaseLvl + 500;
}

function onClick1(obj) {
  clickGain *= 2;
}

function onClick2(obj) {
  autoMoney(obj.purchaseLvl);
}

function onClick3(obj) {
  autoGain *= 2;
}

// Магазин
const shop = [
  new ShopElement("b1", newPrice1, onClick1),
  new ShopElement("b2", newPrice2, onClick2),
  new ShopElement("b3", newPrice3, onClick3),
];

// Инициализация
updateMoney();
for (let i = 0; i < shop.length; i++) {
  shop[i].update();
}

clickerButton.addEventListener("click", () => {
  money += clickGain;
  updateMoney();
  saveProgress();
});

// Функция для отправки запроса на сервер
async function sendRequest(url, method, body = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    throw new Error("Ошибка запроса");
  }

  return response.json();
}

// Регистрация
async function register(username, password) {
  try {
    const data = await sendRequest("http://localhost:5000/api/auth/register", "POST", {
      username,
      password,
    });
    console.log("Пользователь зарегистрирован:", data);
  } catch (error) {
    console.error("Ошибка регистрации:", error);
  }
}

// Вход
async function login(username, password) {
  try {
    const data = await sendRequest("http://localhost:5000/api/auth/login", "POST", {
      username,
      password,
    });
    token = data.token; // Сохраняем токен
    console.log("Вход выполнен:", data);
  } catch (error) {
    console.error("Ошибка входа:", error);
  }
}

// Сохранение прогресса
async function saveProgress() {
  try {
    await sendRequest("http://localhost:5000/api/game/save", "POST", {
      userId: 1, // Замените на реальный ID пользователя
      money,
      clickGain,
      autoGain,
      shopData,
    });
    console.log("Прогресс сохранен");
  } catch (error) {
    console.error("Ошибка сохранения прогресса:", error);
  }
}

// Загрузка прогресса
async function loadProgress(userId) {
  try {
    const data = await sendRequest(`http://localhost:5000/api/game/load/${userId}`, "GET");
    money = data.money;
    clickGain = data.click_gain;
    autoGain = data.auto_gain;
    shopData = data.shop_data;
    updateMoney();
    console.log("Прогресс загружен:", data);
  } catch (error) {
    console.error("Ошибка загрузки прогресса:", error);
  }
}

// Обработчик клика по кнопке
clickerButton.addEventListener("click", () => {
  money += clickGain;
  updateMoney();
  saveProgress();
});

// Открытие модального окна при нажатии на кнопку "Вход/Регистрация"
document.getElementById("b4").addEventListener("click", () => {
  authModal.style.display = "block";
});

// Закрытие модального окна при нажатии на крестик
closeModal.addEventListener("click", () => {
  authModal.style.display = "none";
});

// Закрытие модального окна при клике вне его
window.addEventListener("click", (event) => {
  if (event.target === authModal) {
    authModal.style.display = "none";
  }
});

// Обработка входа
loginBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  await login(username, password);
  authModal.style.display = "none";
});

// Обработка регистрации
registerBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  await register(username, password);
  authModal.style.display = "none";
});

// Инициализация при загрузке страницы
(async () => {
  // Пример регистрации и входа
  await register("user", "password");
  await login("user", "password");

  // Загрузка прогресса
  await loadProgress(1); // Замените на реальный ID пользователя
})();

// После успешного входа или регистрации
localStorage.setItem("username", username);

// При загрузке страницы
window.addEventListener("load", () => {
  const savedUsername = localStorage.getItem("username");
  if (savedUsername) {
    document.getElementById("username-display").textContent = savedUsername;
  }
});