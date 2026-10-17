const searchForm = document.querySelector("#weatherSearch");
const cityInput = document.querySelector("#cityInput");
const searchButton = searchForm.querySelector("button");
const statusMessage = document.querySelector("#statusMessage");

const ui = {
  city: document.querySelector("#weatherCity"),
  date: document.querySelector("#weatherDate"),
  condition: document.querySelector("#weatherCondition"),
  icon: document.querySelector("#weatherIcon"),
  temperature: document.querySelector("#temperature"),
  feelsLike: document.querySelector("#feelsLike"),
  min: document.querySelector("#tempMin"),
  max: document.querySelector("#tempMax"),
  humidity: document.querySelector("#humidity"),
  wind: document.querySelector("#windSpeed"),
  pressure: document.querySelector("#pressure"),
  visibility: document.querySelector("#visibility"),
};

const API_KEY = "a14cfff1f4e3ff869b16dee516b3ea0d";

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `message ${type}`.trim();
}

function formatCityTime(unixSeconds, timezoneOffsetSeconds) {
  // OpenWeather's timezone offset is relative to UTC, in seconds.
  const localTime = new Date((unixSeconds + timezoneOffsetSeconds) * 1000);
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(localTime);
}

function formatTemperature(value) {
  return `${Math.round(value)}°`;
}

function renderWeather(data) {
  const { name, sys, dt, timezone, main, weather, wind, visibility } = data;
  const condition = weather?.[0];
  if (!main || !sys || !condition) throw new Error("The weather response was incomplete.");

  const country = sys.country
    ? new Intl.DisplayNames(["en"], { type: "region" }).of(sys.country)
    : "";

  ui.city.textContent = [name, country].filter(Boolean).join(", ");
  ui.date.textContent = formatCityTime(dt, timezone ?? 0);
  ui.condition.textContent = condition.description || condition.main || "Current conditions";
  ui.temperature.textContent = Math.round(main.temp);
  ui.feelsLike.textContent = formatTemperature(main.feels_like);
  ui.min.textContent = formatTemperature(main.temp_min);
  ui.max.textContent = formatTemperature(main.temp_max);
  ui.humidity.textContent = `${main.humidity}%`;
  ui.wind.textContent = `${wind?.speed ?? "—"} m/s`;
  ui.pressure.textContent = `${main.pressure} hPa`;
  ui.visibility.textContent = Number.isFinite(visibility)
    ? `${(visibility / 1000).toFixed(1)} km`
    : "—";

  if (condition.icon) {
    ui.icon.src = `https://openweathermap.org/img/wn/${condition.icon}@2x.png`;
    ui.icon.alt = condition.description || condition.main || "Weather icon";
    ui.icon.hidden = false;
  } else {
    ui.icon.hidden = true;
    ui.icon.removeAttribute("src");
  }
  document.title = `Atmos — ${name} Weather`;
}

async function getWeather(city) {
  const cleanCity = city.trim();
  if (!cleanCity) {
    setStatus("Enter a city name to search.", "error");
    cityInput.focus();
    return;
  }

  searchButton.disabled = true;
  setStatus(`Finding the latest weather for ${cleanCity}…`);

  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.search = new URLSearchParams({ q: cleanCity, appid: API_KEY, units: "metric" });
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 404) throw new Error("We couldn't find that city. Check the spelling and try again.");
      if (response.status === 401) throw new Error("Weather service authentication failed. Check the API key configuration.");
      if (response.status === 429) throw new Error("Too many requests right now. Please wait a moment and try again.");
      throw new Error(data.message ? `Weather service: ${data.message}` : "Weather data is temporarily unavailable. Please try again.");
    }

    renderWeather(data);
    setStatus(`Weather updated for ${data.name}.`, "success");
  } catch (error) {
    console.error("Unable to load weather:", error);
    setStatus(error instanceof TypeError
      ? "Couldn't connect to the weather service. Check your internet connection and try again."
      : (error.message || "Something went wrong. Please try again."), "error");
  } finally {
    searchButton.disabled = false;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const requestedCity = cityInput.value;
  getWeather(requestedCity);
});

getWeather("Karachi");
