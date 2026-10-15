import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";


import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";


// Forms Elements ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const form = document.getElementById("form-character");
const header = document.querySelector(".character-header");

const itemContainers = form.querySelectorAll(".container");

const diceEl = document.querySelector("#dice-roll");

const nextTurnBtn = document.getElementById("next-turn");

// Character Elements -------------
const charNameEl = form.querySelector('#char-name');
const charLevelEl = form.querySelector('#char-level');

const actualHealthEl = form.querySelector("#char-actual-health");
const healthInfoEl = form.querySelector("#char-health-info");

const healthSetter = form.querySelector(".calc-pv-container");

const armorEl = form.querySelector(".armor-container");
const armorNameEl = armorEl.querySelector(".armor-name");
const armorValueEl = armorEl.querySelector(".armor-value");
const armorDescriptionEl = armorEl.querySelector(".armor-description");
const armorExpandDescriptionBtn = armorEl.querySelector(".expand-btn");

const protectionEl = form.querySelector("#protection");

const attributesEl = form.querySelectorAll(".attribute");

const descriptionEl = form.querySelector("#description");

// Variables ----------------------------------------------------------------------------------------------------------------------------------------------------------------------

const character = {
    info: {
        name: "",
        level: 1
    },
    status: {
        actualHealth: 1,
        maxHealth: 1,
        protection: 1
    },
    attributes: {
        strength: 1,
        dexterity: 1,
        intelligence: 1,
        charism: 1
    },
    armor: {
        name: "",
        value: 0,
        description: ""

    },
    effectsValues: {
        maxhealth: 0,
        protection: 0,
        strength: 0,
        dexterity: 0,
        intelligence: 0,
        charism: 0,
        movement: 0
    },
    weapons: [],
    effects: [],
    skills: [],
    inventory: [],
    description: ""
}

const systemMetrics = {
    info: {
        level: {
            minValue: 1,
            maxValue: 10
        }
    },
    status: {
        health: {
            initialValue: 15,
            scaling: 5,
            minValue: 0
        }
    },

    attributes: {
        maxValue: 3,
        minValue: 1
    }
}



let currentUser = null;
let isLoadingCharacter = false;
let saveTimeout = null;

function getCharacterData() {
    return {
        info: { ...character.info },
        status: {
            actualHealth: Number(character.status.actualHealth)
        },
        attributes: { ...character.attributes },
        armor: { ...character.armor },
        effectsValues: { ...character.effectsValues },
        weapons: character.weapons.slice(1),
        effects: character.effects.slice(1),
        skills: character.skills.slice(1),
        inventory: character.inventory.slice(1),
        description: character.description
    };
}

async function saveCharacter() {
    if (!currentUser) return;

    const sheetRef = doc(
        db,
        "users",
        currentUser.uid,
        "sheets",
        "main"
    );

    try {
        await setDoc(sheetRef, getCharacterData());
        console.info("Ficha salva.");
    } catch (error) {
        console.error("Erro ao salvar ficha:", error);
    }
}

function scheduleSave() {
    if (!currentUser || isLoadingCharacter) return;

    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
        saveCharacter();
    }, 600);
}

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Running

setElementValues();
updateCharacter();

form.addEventListener('submit', function (event) {
    event.preventDefault(); // Impede o envio do formulário
});

// Set Containers to Add/Remove Items 

itemContainers.forEach(container => {

    const addItemBtn = container.parentElement.querySelector(".add-item-btn");
    let indexItem = 0;

    switch (container.id) {
        case "weapons":

            addItemBtn.addEventListener("click", () => {

                let allContainerItems = container.querySelectorAll(".weapon-item");

                indexItem = allContainerItems.length + 1;

                const htmlString =
                    `
                        <div class="weapon-item container-item" data-index="${indexItem}">
                            <div class="container-subitem">
                                <input class="item-name" type="text" placeholder="Nome da Arma"/>
                                <input class="dices value-small center" type="number" min="1" max="2" placeholder="0" value="1" />
                                <button class="roll-btn" type="button">R</button>
                                <button class="expand-btn" type="button">+</button>
                            </div>
                            <textarea name="description-item" class="item-description hidden" placeholder="Descrição" ></textarea>
                            <button class="action-btn hidden">Remover Item</button>
                        </div>
                    `;

                container.insertAdjacentHTML("beforeend", htmlString);

                let weaponEl = container.querySelector(`div[data-index='${indexItem}']`);

                const weaponNameEl = weaponEl.querySelector(".item-name");
                const weaponDicesEl = weaponEl.querySelector(".dices");
                const weaponDescriptionEl = weaponEl.querySelector(".item-description");

                const weaponRollBtn = weaponEl.querySelector(".roll-btn");

                const showDescriptioBtn = weaponEl.querySelector(".expand-btn");
                const removeItemBtn = weaponEl.querySelector(".action-btn");

                character.weapons[indexItem] = {
                    name: "",
                    dices: 1,
                    description: ""
                };

                // Update Character Data
                weaponNameEl.addEventListener("change", (e) => {
                    indexItem = weaponEl.dataset.index;
                    weaponEl = container.querySelector(`div[data-index='${indexItem}']`);
                    character.weapons[indexItem].name = e.target.value;
                });

                weaponDicesEl.addEventListener("change", (e) => {
                    indexItem = weaponEl.dataset.index;
                    weaponEl = container.querySelector(`div[data-index='${indexItem}']`);
                    character.weapons[indexItem].dices = Number(e.target.value);
                });

                weaponDescriptionEl.addEventListener("change", (e) => {
                    indexItem = weaponEl.dataset.index;
                    weaponEl = container.querySelector(`div[data-index='${indexItem}']`);
                    character.weapons[indexItem].description = e.target.value;
                });


                showDescriptioBtn.addEventListener("click", () => {

                    weaponDescriptionEl.classList.toggle("hidden");
                    removeItemBtn.classList.toggle("hidden");

                });

                removeItemBtn.addEventListener("click", () => {

                    indexItem = weaponEl.dataset.index;
                    allContainerItems = container.querySelectorAll(".weapon-item");

                    if (allContainerItems.length > indexItem) {

                        allContainerItems.forEach(item => {

                            if (item.dataset.index > indexItem) {

                                character.weapons[item.dataset.index - 1].name = character.weapons[item.dataset.index].name;
                                character.weapons[item.dataset.index - 1].dices = character.weapons[item.dataset.index].dices;
                                character.weapons[item.dataset.index - 1].description = character.weapons[item.dataset.index].description;

                                item.dataset.index--;
                            }
                        });

                    }

                    weaponEl.remove();
                    character.weapons.splice(character.weapons.length - 1, 1);
                })

                // Roll Dice

                weaponRollBtn.addEventListener("click", () => {

                    indexItem = weaponEl.dataset.index;
                    weaponEl = container.querySelector(`div[data-index='${indexItem}']`);

                    diceRoll(character.weapons[indexItem].dices, true);

                });

            });
            break;

        case "skills":

            addItemBtn.addEventListener("click", () => {

                let allContainerItems = container.querySelectorAll(".skill-item");

                indexItem = allContainerItems.length + 1;

                const htmlString =
                    `
                        <div class="skill-item container-item" data-index="${indexItem}">
                            <div class="container-subitem">
                                <input class="item-name" type="text" placeholder="Nome da Habilidade"/>
                                <input class="dices value-small center" type="number" min="0" max="2" placeholder="0" value="0" />
                                <button class="roll-btn" type="button">R</button>
                                <button class="expand-btn" type="button">+</button>
                            </div>
                            <textarea name="description-item" class="item-description hidden" placeholder="Descrição" ></textarea>
                            <button class="action-btn hidden">Remover Item</button>
                            <hr>
                        </div>
                    `;

                container.insertAdjacentHTML("beforeend", htmlString);

                let skillEl = container.querySelector(`div[data-index='${indexItem}']`);

                const skillNameEl = skillEl.querySelector(".item-name");
                const skillDicesEl = skillEl.querySelector(".dices");
                const skillDescriptionEl = skillEl.querySelector(".item-description");

                const skillRollBtn = skillEl.querySelector(".roll-btn");

                const showDescriptioBtn = skillEl.querySelector(".expand-btn");
                const removeItemBtn = skillEl.querySelector(".action-btn");

                character.skills[indexItem] = {
                    name: "",
                    dices: 0,
                    description: ""
                };

                // Update Character Data
                skillNameEl.addEventListener("change", (e) => {
                    indexItem = skillEl.dataset.index;
                    skillEl = container.querySelector(`div[data-index='${indexItem}']`);
                    character.skills[indexItem].name = e.target.value;
                });

                skillDicesEl.addEventListener("change", (e) => {
                    indexItem = skillEl.dataset.index;
                    skillEl = container.querySelector(`div[data-index='${indexItem}']`);
                    character.skills[indexItem].dices = Number(e.target.value);
                });

                skillDescriptionEl.addEventListener("change", (e) => {
                    indexItem = skillEl.dataset.index;
                    skillEl = container.querySelector(`div[data-index='${indexItem}']`);
                    character.skills[indexItem].description = e.target.value;
                });


                showDescriptioBtn.addEventListener("click", () => {

                    skillDescriptionEl.classList.toggle("hidden");
                    removeItemBtn.classList.toggle("hidden");

                });

                skillRollBtn.addEventListener("click", () => {

                    indexItem = skillEl.dataset.index;
                    weaponEl = container.querySelector(`div[data-index='${indexItem}']`);

                    diceRoll(character.skills[indexItem].dices, true);

                });

                removeItemBtn.addEventListener("click", () => {

                    indexItem = skillEl.dataset.index;
                    allContainerItems = container.querySelectorAll(".skill-item");

                    if (allContainerItems.length > indexItem) {

                        allContainerItems.forEach(item => {

                            if (item.dataset.index > indexItem) {

                                character.skills[item.dataset.index - 1].name = character.skills[item.dataset.index].name;
                                character.skills[item.dataset.index - 1].dices = character.skills[item.dataset.index].dices;
                                character.skills[item.dataset.index - 1].description = character.skills[item.dataset.index].description;
                                item.dataset.index--;
                            }

                        });

                    }

                    skillEl.remove();
                    character.skills.splice(character.skills.length - 1, 1);
                })

            });
            break;

        case "inventory":

            addItemBtn.addEventListener("click", () => {

                let allContainerItems = container.querySelectorAll(".inventory-item");

                indexItem = allContainerItems.length + 1;

                const htmlString =
                    `
                        <div class="inventory-item container-item" data-index="${indexItem}">
                            <div class="container-subitem">
                                <input class="item-name" type="text" placeholder="Nome do Item"/>
                                <button class="expand-btn" type="button">+</button>
                            </div>
                            <textarea name="description-item" class="item-description hidden" placeholder="Descrição"></textarea>
                            <button class="action-btn hidden">Remover Item</button>
                            <hr>
                        </div>
                    `;

                container.insertAdjacentHTML("beforeend", htmlString);

                let itemEl = container.querySelector(`div[data-index='${indexItem}']`);

                const itemNameEl = itemEl.querySelector(".item-name");
                const itemDescriptionEl = itemEl.querySelector(".item-description");

                const showDescriptioBtn = itemEl.querySelector(".expand-btn");
                const removeItemBtn = itemEl.querySelector(".action-btn");

                character.inventory[indexItem] = {
                    name: "",
                    description: ""
                };

                // Update Character Data
                itemNameEl.addEventListener("change", (e) => {
                    indexItem = itemEl.dataset.index;
                    itemEl = container.querySelector(`div[data-index='${indexItem}']`);
                    character.inventory[indexItem].name = e.target.value;
                });

                itemDescriptionEl.addEventListener("change", (e) => {
                    indexItem = itemEl.dataset.index;
                    itemEl = container.querySelector(`div[data-index='${indexItem}']`);
                    character.inventory[indexItem].description = e.target.value;
                });


                showDescriptioBtn.addEventListener("click", () => {

                    itemDescriptionEl.classList.toggle("hidden");
                    removeItemBtn.classList.toggle("hidden");

                });

                removeItemBtn.addEventListener("click", () => {

                    indexItem = itemEl.dataset.index;
                    allContainerItems = container.querySelectorAll(".inventory-item");

                    if (allContainerItems.length > indexItem) {

                        allContainerItems.forEach(item => {

                            if (item.dataset.index > indexItem) {

                                character.inventory[item.dataset.index - 1].name = character.inventory[item.dataset.index].name;
                                character.inventory[item.dataset.index - 1].description = character.inventory[item.dataset.index].description;

                                item.dataset.index--;
                            }

                        });

                    }

                    itemEl.remove();
                    character.inventory.splice(character.inventory.length - 1, 1);
                })

            });
            break;

        case "effects":

            addItemBtn.addEventListener("click", () => {

                let allContainerItems = container.querySelectorAll(".effects-item");

                indexItem = allContainerItems.length + 1;

                const htmlString =
                    `
                        <div class="effects-item container-item" data-index="${indexItem}">
                            <div class="container-subitem">
                                <input class="turns value-small center" name="effect-turns" type="number" placeholder="0" min="0" value="1" />
                                <input class="item-name" name="effect-name" type="text" placeholder="Nome do Efeito"/>
                                <select class="select-option" name="modifier-option">
                                    <option value="maxhealth">Max. PV</option>
                                    <option value="protection">Prot.</option>
                                    <option value="strength">FOR</option>
                                    <option value="dexterity">DEX</option>
                                    <option value="intelligence">INT</option>
                                    <option value="charism">CAR</option>
                                    <option value="movement">MOV</option>
                                </select>
                                <input class="value value-small center" name="effect-value" type="number" placeholder="0" value="0" />
                                <button class="expand-btn" type="button">+</button>
                            </div>
                            <textarea name="description-item" class="item-description hidden" placeholder="Descrição"></textarea>
                            <button class="action-btn hidden">Remover Item</button>
                        </div>
                    `;

                container.insertAdjacentHTML("beforeend", htmlString);

                let itemEffectEl = container.querySelector(`div[data-index='${indexItem}']`);

                const effectNameEl = itemEffectEl.querySelector(".item-name")
                const effectTurnsEl = itemEffectEl.querySelector(".turns");
                const effectOptionSelectEl = itemEffectEl.querySelector(".select-option");
                const effectValueEl = itemEffectEl.querySelector(".value");
                const effectDescriptionEl = itemEffectEl.querySelector(".item-description")

                const showDescriptioBtn = itemEffectEl.querySelector(".expand-btn");
                const removeItemBtn = itemEffectEl.querySelector(".action-btn");

                character.effects[indexItem] = {
                    name: "",
                    turns: 1,
                    option: effectOptionSelectEl.value,
                    value: 0,
                    description: ""
                };

                // Set Effects - Trocar este set pelo array de efeitos e criar outra função para transformar todo o array de efeitos em effectValues que são somados aos testes

                effectNameEl.addEventListener("change", (e) => {
                    indexItem = itemEffectEl.dataset.index;
                    itemEffectEl = container.querySelector(`div[data-index='${indexItem}']`);

                    character.effects[indexItem].name = e.target.value;
                });

                effectTurnsEl.addEventListener("change", (e) => {
                    indexItem = itemEffectEl.dataset.index;
                    itemEffectEl = container.querySelector(`div[data-index='${indexItem}']`);

                    character.effects[indexItem].turns = e.target.value;
                });

                effectOptionSelectEl.addEventListener("change", (e) => {
                    indexItem = itemEffectEl.dataset.index;
                    itemEffectEl = container.querySelector(`div[data-index='${indexItem}']`);

                    character.effects[indexItem].option = e.target.value;
                    setEffectsData();
                });

                effectValueEl.addEventListener("change", (e) => {
                    indexItem = itemEffectEl.dataset.index;
                    itemEffectEl = container.querySelector(`div[data-index='${indexItem}']`);

                    character.effects[indexItem].value = e.target.value;
                    setEffectsData();
                });

                effectDescriptionEl.addEventListener("change", (e) => {
                    indexItem = itemEffectEl.dataset.index;
                    itemEffectEl = container.querySelector(`div[data-index='${indexItem}']`);

                    character.effects[indexItem].description = e.target.value;
                });


                // Show/Hide Description

                showDescriptioBtn.addEventListener("click", () => {

                    effectDescriptionEl.classList.toggle("hidden");
                    removeItemBtn.classList.toggle("hidden");

                });

                removeItemBtn.addEventListener("click", () => {

                    indexItem = itemEffectEl.dataset.index;
                    allContainerItems = container.querySelectorAll(".effects-item");

                    if (allContainerItems.length > indexItem) {

                        allContainerItems.forEach(item => {

                            if (item.dataset.index > indexItem) {

                                character.effects[item.dataset.index - 1].name = character.effects[item.dataset.index].name;
                                character.effects[item.dataset.index - 1].turns = character.effects[item.dataset.index].turns;
                                character.effects[item.dataset.index - 1].option = character.effects[item.dataset.index].option;
                                character.effects[item.dataset.index - 1].value = character.effects[item.dataset.index].value;
                                character.effects[item.dataset.index - 1].description = character.effects[item.dataset.index].description;

                                item.dataset.index--;
                            }

                        });

                    }

                    itemEffectEl.remove();
                    character.effects.splice(character.effects.length - 1, 1);
                    setEffectsData();
                })

            });
            break;
    };

});


healthSetter.querySelector("#set-pv-btn").addEventListener("click", () => {

    const setterValue = healthSetter.querySelector("#set-pv-value");

    character.status.actualHealth = Number(character.status.actualHealth) + Number(setterValue.value);

    updateCharacter();
    setterValue.value = 0;

});


// Armor Expand Description

armorExpandDescriptionBtn.addEventListener("click", (e) => {

    armorDescriptionEl.classList.toggle("hidden");

})

// Set Inputs Event Listeners to Check
charNameEl.addEventListener("change", (e) => {

    character.info.name = e.target.value;
    updateCharacter();
})

charLevelEl.addEventListener("change", (e) => {

    character.info.level = clampValue(e.target.value, systemMetrics.info.level.minValue, systemMetrics.info.level.maxValue);
    updateCharacter();
})

actualHealthEl.addEventListener("change", (e) => {

    character.status.actualHealth = clampValue(e.target.value, systemMetrics.status.health.minValue, character.status.maxHealth);
    updateCharacter();
})

armorNameEl.addEventListener("change", (e) => {
    character.armor.name = e.target.value;
    updateCharacter();
})

armorValueEl.addEventListener("change", (e) => {
    character.armor.value = e.target.value;
    updateCharacter();
});

armorDescriptionEl.addEventListener("change", (e) => {
    character.armor.description = e.target.value;
    updateCharacter();
})

attributesEl.forEach(attribute => {

    const attributeName = attribute.dataset.attribute;

    const attRoll = attribute.querySelector(".roll");
    const attInput = attribute.querySelector(".attribute-value");

    attInput.addEventListener("change", () => {

        character.attributes[attributeName] = clampValue(attInput.value, systemMetrics.attributes.minValue, systemMetrics.attributes.maxValue);

        updateCharacter();
    })

    attRoll.addEventListener("click", () => {

        diceRoll(character.attributes[attributeName], false, character.effectsValues[attributeName]);

    })

});

descriptionEl.addEventListener("change", (e) => {
    character.description = e.target.value;
    updateCharacter();
})

nextTurnBtn.addEventListener("click", () => nexTurn());

// Functions -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Set Elements Data
function setElementValues() {

    charNameEl.value = character.info.name;
    charLevelEl.value = character.info.level;

    actualHealthEl.innerHTML = `<span class="${getClassByPvValue(character.status.actualHealth, character.status.maxHealth)}">${character.status.actualHealth}</span>`;
    healthInfoEl.textContent = `PV: ${character.status.actualHealth}/${character.status.maxHealth}\n`;

    protectionEl.textContent = character.status.protection;

    attributesEl.forEach(attribute => {

        const attributeName = attribute.dataset.attribute;
        const valueInput = attribute.querySelector(".attribute-value");

        valueInput.value = character.attributes[attributeName];
    })

}

// Calculate Values by Attributes
function updateCharacter() {

    character.status.maxHealth = Number(systemMetrics.status.health.initialValue) + (Number(character.attributes.strength) * Number(systemMetrics.status.health.scaling)) + Number(character.effectsValues.maxhealth);
    character.status.protection = Number(character.attributes.strength) + Number(character.armor.value) + Number(character.effectsValues.protection);

    setElementValues();
}

// Attributes Verification

function clampValue(input, min, max) {
    let value = parseInt(input, 10);
    return Math.min(Math.max(value, min), max);
};

// Save Array Input Datas

function saveArrayDatas(element, dataType) {

}

// New Dice Roll

function diceRoll(diceAmount, isDamage, bonusValue = 0) {

    const iconsContainerEl = diceEl.querySelector(".dices-icon");
    const messageEl = diceEl.querySelector(".dice-value.message");
    const finalValueEl = diceEl.querySelector(".dice-result");
    const closeBtn = diceEl.querySelector(".action-btn");

    const dicesValue = (amount) => {
        const diceArr = [];

        for (let i = 0; i < amount; i++) {
            diceArr.push(Math.floor(Math.random() * 6) + 1);
        }
        return diceArr;
    };

    const diceResult = {
        amount: 0,
        values: dicesValue(diceAmount),
        result: 1,
        message: ""
    }

    if (isDamage) {

        if (diceAmount <= 0 || diceAmount >= 3)
            return;

        switch (diceAmount) {

            case 1:
                diceResult.amount = 1;

                diceResult.message = `Você rolou 1 dado ${bonusValue === 0 ? "" : `${bonusValue > 0 ? `+ ${bonusValue}` : `- ${Math.abs(bonusValue)}`} (Efeito Ativo)`}`;
                diceResult.result = Number(diceResult.values[0]) + Number(bonusValue);
                break;

            case 2:
                diceResult.amount = 2;

                diceResult.message = `Você rolou 2 dados ${bonusValue === 0 ? "" : `${bonusValue > 0 ? `+ ${bonusValue}` : `- ${Math.abs(bonusValue)}`} (Efeito Ativo)`}`;
                diceResult.result = Number(diceResult.values[0]) + Number(diceResult.values[1]) + Number(bonusValue);
                break;

            case 3:
                diceResult.amount = 2;

                diceResult.message = `Você rolou 2 dados + 1 bônus (DT) ${bonusValue === 0 ? "" : `${bonusValue > 0 ? `+ ${bonusValue}` : `- ${Math.abs(bonusValue)}`} (Efeito Ativo)`}`;
                diceResult.result = Math.max(diceResult.values[0], diceResult.values[1]) + 1 + Number(bonusValue);
                break;
        };

    }
    else {

        if (diceAmount <= 0 || diceAmount >= 4)
            return;

        switch (diceAmount) {

            case 1:
                diceResult.amount = 1;

                diceResult.message = `Você rolou 1 dado ${bonusValue === 0 ? "" : `${bonusValue > 0 ? `+ ${bonusValue}` : `- ${Math.abs(bonusValue)}`} (Efeito Ativo)`}`;
                diceResult.result = diceResult.values[0] + Number(bonusValue);
                break;

            case 2:
                diceResult.amount = 2;

                diceResult.message = `Você rolou 2 dados ${bonusValue === 0 ? "" : `${bonusValue > 0 ? `+ ${bonusValue}` : `- ${Math.abs(bonusValue)}`} (Efeito Ativo)`}`;
                diceResult.result = Math.max(diceResult.values[0], diceResult.values[1]) + Number(bonusValue);
                break;

            case 3:
                diceResult.amount = 2;

                diceResult.message = `Você rolou 2 dados + 1 bônus (DT) ${bonusValue === 0 ? "" : `${bonusValue > 0 ? `+ ${bonusValue}` : `- ${Math.abs(bonusValue)}`} (Efeito Ativo)`}`;
                diceResult.result = Math.max(diceResult.values[0], diceResult.values[1]) + 1 + Number(bonusValue);
                break;
        };
    }

    diceEl.classList.remove("hidden");

    iconsContainerEl.innerHTML = "";

    for (let i = 0; i < diceResult.amount; i++) {

        const spanClass = getClassByDiceValue(diceResult.values[i], false);

        const diceString =
            `
            <div class="dice-image">
                <span class="${spanClass} dice-value">${diceResult.values[i]}</span>
            </div>
        `

        iconsContainerEl.insertAdjacentHTML("beforeend", diceString);
    };

    messageEl.textContent = diceResult.message;

    const resultClass = getClassByDiceValue(diceResult.result, isDamage);

    finalValueEl.textContent = diceResult.result;
    finalValueEl.classList.add(resultClass);

    closeBtn.addEventListener("click", () => {

        diceEl.classList.add("hidden");
        finalValueEl.classList.remove(resultClass);

    });

}

function getClassByDiceValue(value, isDamage) {

    if (isDamage) {

        if (value <= 2) {
            return "disaster";
        }
        else if (value <= 4) {
            return "low";
        }
        else if (value <= 8) {
            return "normal";
        }
        else if (value <= 10) {
            return "high";
        }
        else {
            return "extreme";
        }
    }

    else {
        if (value <= 1) {
            return "disaster";
        }
        else if (value === 2) {
            return "low";
        }
        else if (value <= 4) {
            return "normal";
        }
        else if (value === 5) {
            return "high";
        }
        else {
            return "extreme";
        }
    }

};

function getClassByPvValue(value, maxHp) {

    if (value <= 0) {
        return "dying"
    }
    else if (value <= (maxHp * 0.1)) {
        return "injuried";
    }
    else if (value <= (maxHp * 0.5)) {
        return "hurt";
    }
    else if (value < (maxHp)) {
        return "ok";
    }
    else if (value === maxHp) {
        return "full";
    }
    else {
        return "overheal";
    }
}

function nexTurn() {

    const allEffectsEl = form.querySelectorAll(".effects-item");

    allEffectsEl.forEach(effectEl => {

        const turns = effectEl.querySelector(".turns");
        const removeBtn = effectEl.querySelector(".action-btn");

        turns.value--;

        if (turns.value <= 0) {

            removeBtn.click();

        }

    });

    return;
}

function setEffectsData() {

    for (const effectData in character.effectsValues) {
        character.effectsValues[effectData] = 0;
    }

    for (let i = 1; i < character.effects.length; i++) {

        character.effectsValues[character.effects[i].option] += Number(character.effects[i].value);

    };

    updateCharacter();
}


function restoreDynamicItems(data) {
    const itemTypes = [
        { key: "weapons", containerId: "weapons" },
        { key: "skills", containerId: "skills" },
        { key: "inventory", containerId: "inventory" },
        { key: "effects", containerId: "effects" }
    ];

    for (const { key, containerId } of itemTypes) {
        const container = form.querySelector(`#${containerId}`);
        const addButton = container.parentElement.querySelector(".add-item-btn");

        for (const itemData of data[key] ?? []) {
            addButton.click();

            const itemEl = container.querySelector(
                `.container-item[data-index="${container.children.length}"]`
            );

            if (!itemEl) {
                throw new Error(`Não foi possível restaurar o item: ${key}`);
            }

            const setField = (selector, value) => {
                const field = itemEl.querySelector(selector);

                if (field && value !== undefined) {
                    field.value = value;
                    field.dispatchEvent(new Event("change", { bubbles: true }));
                }
            };

            setField(".item-name", itemData.name);
            setField(".dices", itemData.dices);
            setField(".turns", itemData.turns);
            setField(".select-option", itemData.option);
            setField(".value", itemData.value);
            setField(".item-description", itemData.description);
        }
    }
}


//---------------------------------------------------------------------------------


const authPanel = document.querySelector("#auth-panel");
const authForm = document.querySelector("#auth-form");
const authEmail = document.querySelector("#auth-email");
const authPassword = document.querySelector("#auth-password");
const authMessage = document.querySelector("#auth-message");

const userPanel = document.querySelector("#user-panel");
const userEmail = document.querySelector("#user-email");
const loginForm = document.querySelector("#form-character");

document.querySelector("#login-btn").addEventListener("click", () => {
    authPassword.setAttribute("autocomplete", "current-password");
});

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        await signInWithEmailAndPassword(
            auth,
            authEmail.value.trim(),
            authPassword.value
        );

        authMessage.textContent = "";
    } catch (error) {
        authMessage.textContent = "Não foi possível entrar. Verifique o e-mail e a senha.";
        console.error("Erro de login:", error.code);
    }
});

document.querySelector("#register-btn").addEventListener("click", async () => {
    try {
        await createUserWithEmailAndPassword(
            auth,
            authEmail.value.trim(),
            authPassword.value
        );

        authMessage.textContent = "";
    } catch (error) {
        authMessage.textContent =
            error.code === "auth/email-already-in-use"
                ? "Este e-mail já possui uma conta."
                : error.code === "auth/weak-password"
                    ? "A senha precisa ter pelo menos 6 caracteres."
                    : "Não foi possível criar a conta. Verifique os dados.";

        console.error("Erro de cadastro:", error.code);
    }
});

document.querySelector("#logout-btn").addEventListener("click", async () => {
    try {
        await signOut(auth);
    } catch (error) {
        authMessage.textContent = "Não foi possível sair da conta.";
        console.error("Erro ao sair:", error.code);
    }
});


onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    authPanel.classList.toggle("hidden", Boolean(user));
    userPanel.classList.toggle("hidden", !user);

    userEmail.textContent = user?.email ?? "";
    authMessage.textContent = "";

    if (!user) {
        form.classList.add("hidden");
        header.classList.add("hidden")
        return;
    }

    form.classList.add("hidden");
    header.classList.add("hidden")

    try {
        await loadCharacter(user);
        form.classList.remove("hidden");
        header.classList.remove("hidden");
    } catch {
        authMessage.textContent =
            "Não foi possível carregar a ficha. Verifique a conexão e as regras do Firestore.";
    }
});



async function loadCharacter(user) {
    isLoadingCharacter = true;

    try {
        const sheetRef = doc(db, "users", user.uid, "sheets", "main");
        const snapshot = await getDoc(sheetRef);

        // Limpa as listas da interface antes de reconstruí-las.
        for (const id of ["weapons", "skills", "inventory", "effects"]) {
            form.querySelector(`#${id}`).replaceChildren();
        }

        if (snapshot.exists()) {
            const data = snapshot.data();

            Object.assign(character.info, data.info ?? {});
            Object.assign(character.status, data.status ?? {});
            Object.assign(character.attributes, data.attributes ?? {});
            Object.assign(character.armor, data.armor ?? {});
            Object.assign(character.effectsValues, data.effectsValues ?? {});

            character.description = data.description ?? "";

            character.weapons = [];
            character.skills = [];
            character.inventory = [];
            character.effects = [];

            charNameEl.value = character.info.name;
            charLevelEl.value = character.info.level;

            armorNameEl.value = character.armor.name;
            armorValueEl.value = character.armor.value;
            armorDescriptionEl.value = character.armor.description;

            descriptionEl.value = character.description;

            restoreDynamicItems(data);

            setEffectsData();
            updateCharacter();
        } else {
            // Primeira ficha desta conta: mantém os valores iniciais.
            character.weapons = [];
            character.skills = [];
            character.inventory = [];
            character.effects = [];

            setElementValues();
            updateCharacter();
        }

        await saveCharacter();
    } catch (error) {
        console.error("Erro ao carregar ficha:", error);
        throw error;
    } finally {
        isLoadingCharacter = false;
    }
}


form.addEventListener("change", scheduleSave);

form.addEventListener("click", (event) => {
    if (
        event.target.closest(".add-item-btn") ||
        event.target.closest(".action-btn") ||
        event.target.closest("#set-pv-btn") ||
        event.target.closest("#next-turn")
    ) {
        scheduleSave();
    }
});
