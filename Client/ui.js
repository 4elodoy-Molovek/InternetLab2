// ------------------------------------------------------------
// ui.js — генерация HTML формы по схеме
// ------------------------------------------------------------

// Создаёт INPUT элемент
function createInput(label, type = "text") {
    const wrapper = document.createElement("div");
    wrapper.style.margin = "5px 0";

    const lbl = document.createElement("label");
    lbl.textContent = label + ": ";
    wrapper.appendChild(lbl);

    const input = document.createElement("input");
    input.type = type === "number" ? "number" : "text";
    input.dataset.field = label; // важно: сохраняем название поля
    wrapper.appendChild(input);

    return wrapper;
}

// Создаёт информационный блок (fieldset)
function createBlock(title) {
    const field = document.createElement("fieldset");
    field.style.margin = "10px 0";
    field.style.padding = "10px";

    const legend = document.createElement("legend");
    legend.textContent = title;
    field.appendChild(legend);

    return field;
}

// ------------------------------------------------------------
// Главная функция генерации формы
// schema — JSON схема
// form — DOM-элемент формы
// ------------------------------------------------------------
function buildForm(schema, form) {
    form.innerHTML = "";

    // Главный заголовок
    const mainTitle = document.createElement("h2");
    mainTitle.textContent = schema.name;
    form.appendChild(mainTitle);

    // Прямые поля первого уровня (например "квартира")
    for (let key in schema) {
        if (key !== "name" && key !== "resources") {
            form.appendChild(createInput(key, schema[key]));
        }
    }

    // Каждый ресурс = отдельный блок
    schema.resources.forEach(resource => {
        const block = createBlock(resource.name);

        for (let key in resource) {
            if (key !== "name") {
                block.appendChild(createInput(key, resource[key]));
            }
        }

        form.appendChild(block);
    });
}

// ------------------------------------------------------------
// Собрать данные из формы в объект
// ------------------------------------------------------------
function collectFormData(form) {
    const inputs = form.querySelectorAll("input");

    const data = {};

    inputs.forEach(input => {
        const key = input.dataset.field;
        const value = input.value;

        data[key] = value;
    });

    return data;
}
