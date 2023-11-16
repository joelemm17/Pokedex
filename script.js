// base stats, effort value yeild, egg group, moves, catch rate, base exp, locatation areas


// Setup
let imgIdx = 0;
const inputElem = document.querySelector("#poke-input");
inputElem.addEventListener("input", function () {
    search()
});
const pokeScreen = document.querySelector("#screen");
const lcd = document.querySelector("#lcd");
const rightLcd = document.querySelector("#right-lcd");
let nameDrop = document.querySelector("#name-drop")

let nameList = [];
let imgArr = [];
let voices = [];
let pokeSaves = [];
let voiceIdx = 1;
let lcdIdx = 0;
let pokemonObj;

// Create Audio elements
let beepboop = new Audio('./used_sounds/Withdraw.wav');
let switchBoop = new Audio('./used_sounds/Withdraw1.wav');
let wompWomp = new Audio('./used_sounds/Transform.wav');
let whisp = new Audio('./used_sounds/Payday1.wav');

// Get voice list
function getVoices() {
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = function () {
            voices = speechSynthesis.getVoices();
        }
    }
};

async function getNames() {
    let response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=10000`);
    response = await response.json();
    for (let i in response.results) {
        if (i < 1008) {
            nameList.push(response.results[i].name);
            continue
        }
        break
    }
}

function search() {
    let input = inputElem.value;
    if (input.length < 2) {
        return
    }
    let max = 4;
    let i = 0;
    input = input.toLowerCase();
    nameDrop.innerHTML = ""
    for (let name of nameList) {
        if (i <= max) {
            if (name.toLowerCase().includes(input)) {
                if (i == max) {
                    nameDrop.innerHTML += `<h1 onclick="selected(this)" class="list-option-last">${name}</h1>`
                } else {
                    nameDrop.innerHTML += `<h1 onclick="selected(this)" class="list-option">${name}</h1>`
                }
                i++
            }
        }
    }
}

function selected(elem) {
    inputElem.value = elem.innerText
    nameDrop.innerHTML = '';
    catchPokemon();
}

function savePokemon() {
    if (pokeSaves.length < 10) {
        let found = false
        for (let pokemon of pokeSaves) {
            if (pokemon.id == pokemonObj.id) {
                found = true
            }
        }
        if (found) {
            wompWomp.play();
            setTimeout(function() {
                let speech3 = new SpeechSynthesisUtterance();
                speech3.pitch = -1
                speech3.voice = voices[voiceIdx]
                speech3.text = `${pokemonObj.name} has already been added to the list.`;
                window.speechSynthesis.speak(speech3);
            }, 500);
        } else {
            pokeSaves.push(pokemonObj);
            blueButtonsPics()
        }
    }
    else {
        wompWomp.play();
        let speech2 = new SpeechSynthesisUtterance();
        speech2.pitch = -1
        speech2.voice = voices[voiceIdx]
        speech2.text = "No more room, you must delete a favorited pokemon.";
        window.speechSynthesis.speak(speech2);
    }

}

function blueButtonsPics() {
    let buttons = document.querySelectorAll(".blue-button");
    for (let i in buttons) {
        if (i < pokeSaves.length) {
            if (pokeSaves[i].id == pokemonObj.id) {
                buttons[i].classList.add("selected-save")
                buttons[i].innerHTML = `<img onclick="switchToFav(${i})" class="fav-save" src="${pokeSaves[i].sprites[0]}" alt="" >`
            } else {
                buttons[i].innerHTML = `<img onclick="switchToFav(${i})" class="fav-save" src="${pokeSaves[i].sprites[0]}" alt="" >`
                buttons[i].classList.remove("selected-save");
            }
        }
    }
}

function switchToFav(idx) {
    if(pokemonObj.id!=pokeSaves[idx].id){
        pokemonObj = pokeSaves[idx];
        build();
        blueButtonsPics();
        switchBoop.play();
    }
}

// Defining a pokemon obj to combine multiple api responses into a single obj
class Pokemon {
    constructor(data) {
        this.name = data.name;
        this.id = data.id;
        this.height = data.height;
        this.weight = data.weight;
        this.types = data.types;
        this.abilities = data.abilities;
        this.sprites = data.sprites;
        this.stats = this.buildStats(data.stats);
        this.evolutionList = this.evolutionList(data.evolvesTo);
        this.evolutionListIdx = this.getEvoIdx()
        this.pokedexEntry = this.createEntry(data);
        this.officialEntry = data.officialEntry;
        console.log(this)
    }

    createEntry(pokeData) {
        let entry = `${pokeData.name} is a `;
        for (let i in pokeData.types) {
            if (i < pokeData.types.length - 1) {
                entry += `${pokeData.types[i].type.name} and `
            } else {
                entry += `${pokeData.types[i].type.name} `
            }
        }
        entry += `type pokemon. ID number ${pokeData.id}, ${pokeData.officialEntry.replace(/(\r\n|\f|\n|\r)/gm, " ")}. At a weight of ${pokeData.weight} kilograms, and standing at around `
        if (pokeData.height > 10) {
            entry += `${pokeData.height / 10} meters tall. `
        } else {
            entry += `${pokeData.height} tenths of a meter tall. `
        }
        if (pokeData.abilities.length > 0) {
            entry += `${pokeData.name} is known for the special abilities `
        }
        for (let i in pokeData.abilities) {
            if (i == pokeData.abilities.length - 1) {
                entry += `${pokeData.abilities[i].ability.name}. `
            }
            else if (i == pokeData.abilities.length - 2) {
                entry += `${pokeData.abilities[i].ability.name}, and `
            }
            else {
                entry += `${pokeData.abilities[i].ability.name}, `
            }
        }
        let idx = parseInt(this.evolutionListIdx) + 1
        if (this.evolutionList[idx] && this.evolutionList[idx].level != null) {
            entry += `Evolves to ${this.evolutionList[idx].name}, at a level of ${this.evolutionList[idx].level}. `

        } else if (this.evolutionList[idx]) {
            if (this.evolutionList[idx].item != null) {
                entry += `Has been known to evolve with a ${this.evolutionList[idx].item.name}, but more research is needed. `
            } else {
                entry += `Has been known to evolve with human intervention, but more research is needed. `

            }
        }
        else {
            entry += `It is believed ${this.name} is unable to evolve to any further forms.`
        }
        return entry
    }
    evolutionList(data) {
        let evoList = []
        let runner = data.chain;
        while (runner.evolves_to) {
            if (runner.evolution_details[0]) {
                // console.log("name:"+runner.species.name+",  url:" + runner.species.url + ", level: " + runner.evolution_details[0].min_level)
                evoList.push({ name: runner.species.name, url: runner.species.url, level: runner.evolution_details[0].min_level, id: runner.species.url.replace(/\D/g, '').substring(1), item: runner.evolution_details[0].item });
            } else {
                // console.log("name:"+runner.species.name+",  url:" + runner.species.url + ", level: 1")
                evoList.push({ name: runner.species.name, url: runner.species.url, level: 0, id: runner.species.url.replace(/\D/g, '').substring(1), item: null })
            }
            if (runner.evolves_to[0]) {
                runner = runner.evolves_to[0];
            } else {
                break
            }
        }
        for (let evo of evoList) {
            evo.sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`
        }
        return evoList;
    }

    getEvoIdx() {
        let idx = 0;
        for (let i in this.evolutionList) {
            if (this.evolutionList[i].name == this.name) {
                idx = i;
            }
        }
        return idx
    }

    buildStats(stats) {
        let statList = {};
        for (let stat of stats) {
            let statName = stat.stat.name
            statList[statName] = { base: stat.base_stat, effort: stat.effort, url: stat.stat.url }
        }
        return statList;
    }
}

//Build evoultion list

//Build Pokemon specfic html
function build() {
    pokeScreen.innerHTML = `<img class="poke-img" src="${pokemonObj.sprites[imgIdx]}" alt="">`

    lcd.innerHTML = `
    <h1>Name: ${pokemonObj.name.charAt(0).toUpperCase() + pokemonObj.name.substring(1)}</h1>
    <h2>ID: ${pokemonObj.id}</h2>`
    lcd.innerHTML += `<h3 class="inline">Type/s: </h3>`
    for (let type of pokemonObj.types) {
        lcd.innerHTML += `<h3 class="inline">${type.type.name} </h3> `
    }

    lcd.innerHTML += `
        <div class="flex-wrap">
            <h3>Height:${pokemonObj.height / 10}m</h3>
            <h3>Weight:${pokemonObj.weight}kg</h3>
        </div>
        `
    console.log(pokemonObj.stats)
    rightLcd.innerHTML = ""
    for (let i in pokemonObj.evolutionList) {
        if (pokemonObj.evolutionList[i].level != 0 && pokemonObj.evolutionList[i].level != null) {
            rightLcd.innerHTML += `<div class="vert-flex"><h1 class="big-text">➡</h1><h4>Lvl: ${pokemonObj.evolutionList[i].level}</h4>`
        } else if (i != 0) {
            if (pokemonObj.evolutionList[i].item != null) {
                rightLcd.innerHTML += `<div class="vert-flex"><h1 class="big-text">➡</h1><p>${pokemonObj.evolutionList[i].item.name}</p>`
            } else {
                rightLcd.innerHTML += `<div class="vert-flex"><h1 class="big-text">➡</h1><h4>???</h4>`
            }
        }
        if (pokemonObj.evolutionList[i].name == pokemonObj.name) {
            rightLcd.innerHTML += `<div class="evo-pics-current" ><img class="poke-img-small" src="${pokemonObj.evolutionList[i].sprite}" alt="picture"><h3>ID:${pokemonObj.evolutionList[i].id}</h3><h3>${pokemonObj.evolutionList[i].name.charAt(0).toUpperCase() + pokemonObj.evolutionList[i].name.substring(1)}</h3></div>`
        } else {
            rightLcd.innerHTML += `<div class="evo-pics" ><img class="poke-img-small" src="${pokemonObj.evolutionList[i].sprite}" alt="picture"><h3>ID:${pokemonObj.evolutionList[i].id}</h3><h3>${pokemonObj.evolutionList[i].name.charAt(0).toUpperCase() + pokemonObj.evolutionList[i].name.substring(1)}</h3></div>`
        }
    }
}


//Fetching pokemon data at pokeapi.co
async function catchPokemon() {
    imgArr = [];
    evoArr = [];
    imgIdx = 0;
    let pokeData = {}
    let pokemon = inputElem.value;

    let response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
    response = await response.json();
    let responseSpecies = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${response.id}`);
    responseSpecies = await responseSpecies.json();
    let responseEvo = await fetch(responseSpecies.evolution_chain.url);
    responseEvo = await responseEvo.json();

    console.log(response);
    console.log(responseSpecies)
    // Build sprite array
    for (let imgKey in response.sprites) {
        if (response.sprites[imgKey] != null && typeof (response.sprites[imgKey]) == "string") {
            if (imgKey == "front_default") {
                imgArr.unshift(response.sprites[imgKey])
            }
            else {
                imgArr.push(response.sprites[imgKey])
            }
        }
    }



    pokeData.name = response.name;
    pokeData.id = response.id;
    pokeData.height = response.height;
    pokeData.weight = response.weight;
    pokeData.types = response.types;
    pokeData.abilities = response.abilities;
    pokeData.sprites = imgArr;
    pokeData.stats = response.stats;
    pokeData.captureRate = responseSpecies.capture_rate;
    pokeData.baseHappiness = responseSpecies.base_happiness;
    pokeData.eggGroup = responseSpecies.egg_groups;
    pokeData.growthRate = responseSpecies.growth_rate.name;
    pokeData.habitat = responseSpecies.habitat.name;
    pokeData.evolvesTo = responseEvo;
    pokeData.officialEntry = responseSpecies.flavor_text_entries[1].flavor_text.replace(/(\r\n|\f|\n|\r)/gm, " ");
    pokemonObj = new Pokemon(pokeData);
    beepboop.play();
    build();
}

function dynamicLcd() {
    lcd.innerHTML = ""
    if (lcdIdx == 1) {
        lcd.innerHTML = `
            <div class="flex-wrap">
                <h3 class="small-font">Atttack: Base-${pokemonObj.stats.attack.base} Effort-${pokemonObj.stats.attack.effort}</h3>
            </div>
            <div class="flex-wrap">
                <h3 class="small-font">Defense: Base-${pokemonObj.stats.defense.base} Effort-${pokemonObj.stats.defense.effort}</h3>
            </div>
            <div class="flex-wrap">
                <h3 class="small-font">HP: Base-${pokemonObj.stats.hp.base} Effort-${pokemonObj.stats.hp.effort}</h3>
            </div>
            <div class="flex-wrap">
                <h3 class="small-font">Special-Atk: Base-${pokemonObj.stats['special-attack'].base} Effort-${pokemonObj.stats['special-attack'].effort}</h3>
            </div>
            <div class="flex-wrap">
                <h3 class="small-font">Special-Def: Base-${pokemonObj.stats['special-defense'].base} Effort-${pokemonObj.stats['special-defense'].effort}</h3>
            </div>
            <div class="flex-wrap">
                <h3 class="small-font">Speed: Base-${pokemonObj.stats.speed.base} Effort-${pokemonObj.stats.speed.effort}</h3>
            </div>`
    }
    else if (lcdIdx == 0) {
        lcd.innerHTML = `
        <h1>Name: ${pokemonObj.name.charAt(0).toUpperCase() + pokemonObj.name.substring(1)}</h1>
        <h2>ID: ${pokemonObj.id}</h2>`
        lcd.innerHTML += `<h3 class="inline">Type/s: </h3>`
        for (let type of pokemonObj.types) {
            lcd.innerHTML += `<h3 class="inline">${type.type.name} </h3> `
        }
        lcd.innerHTML += `
            <div class="flex-wrap">
            <h3>Height:${pokemonObj.height / 10}m</h3>
            <h3>Weight:${pokemonObj.weight}kg</h3>
            </div>
            `
    }
}

//Button press functions
function picLeft() {
    if (imgIdx < imgArr.length - 1) {
        imgIdx++
    } else {
        imgIdx = 0;
    }
    pokeScreen.innerHTML = `<img class="poke-img" src="${pokemonObj.sprites[imgIdx]}" alt="">`
    whisp.play()
}
function picRight() {
    if (imgIdx > 0) {
        imgIdx--
    } else {
        imgIdx = imgArr.length - 1;
    }
    pokeScreen.innerHTML = `<img class="poke-img" src="${imgArr[imgIdx]}" alt="">`
    whisp.play()
}

function arrowDown() {
    lcdIdx--
    if (lcdIdx < 0) {
        lcdIdx = 1
    }
    dynamicLcd();
    whisp.play()
}

function arrowUp() {
    lcdIdx++
    if(lcdIdx > 1){
        lcdIdx = 0
    }
    dynamicLcd();
    whisp.play()
}

function narrate() {
    var speech = new SpeechSynthesisUtterance();
    speech.pitch = -1
    speech.voice = voices[voiceIdx]
    if (pokemonObj) {
        speech.text = pokemonObj.pokedexEntry;
        window.speechSynthesis.speak(speech);
    } else {
        speech.text = "Please search for a pokemon.";
        window.speechSynthesis.speak(speech);
    }
}
function changeVoice() {
    if (voiceIdx < voices.length - 1) {
        voiceIdx++;
    }
    else {
        voiceIdx = 0;
    }
}

//Initialize
getVoices();
getNames();
