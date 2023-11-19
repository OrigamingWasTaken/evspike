const sourceDropZone = document.querySelector(".source-dropzone")
const sourceP = document.querySelector(".source-dropzone p")
const fromDropZone = document.querySelector(".from-dropzone")
const fromP = document.querySelector(".from-dropzone p")
const processFiles = document.querySelector(".process")
const errorHandler = document.querySelector(".error")

var sourceFile
var sourceJSON
var fromFile
var fromJSON

const saveContent = (file) => {
	var reader = new FileReader()
	reader.readAsText(file, "UTF-8")

	var result
	reader.onload = (readerEvent) => {
		result = readerEvent.target.result
		console.log(result)
	}
	return result
}

const isLmsp = (file) => {
	return file.name.split(".").pop() == "lmsp" || file.name.split(".").pop() == "llsp3"
}

sourceDropZone.addEventListener("dragover", (e) => {
	e.preventDefault()
	sourceDropZone.style.backgroundColor = "#e3e3e3"
})

sourceDropZone.addEventListener("dragleave", (e) => {
	sourceDropZone.style.backgroundColor = "white"
})

sourceDropZone.addEventListener("drop", (e) => {
	e.preventDefault()
	var file = e.dataTransfer.files[0]
	sourceDropZone.style.backgroundColor = "white"
	if (isLmsp(file)) {
		sourceFile = file
		sourceP.innerHTML = sourceFile.name
	} else {
		alert("The file you provided is not .lmsp or .llsp3")
	}
})

sourceDropZone.onmousedown = function (e) {
	var input = document.createElement("input")
	input.type = "file"
	input.accept = ".lmsp,.llsp3"

	input.onchange = (e) => {
		var file = e.target.files[0]
		if (isLmsp(file)) {
			sourceFile = file
			sourceP.innerHTML = sourceFile.name
		} else {
			alert("The file you provided is not .lmsp or .llsp3")
		}
	}

	input.click()
}

fromDropZone.addEventListener("dragover", (e) => {
	e.preventDefault()
	fromDropZone.style.backgroundColor = "#DACDBD"
})

fromDropZone.addEventListener("dragleave", (e) => {
	fromDropZone.style.backgroundColor = "#FFF1D8"
})

fromDropZone.addEventListener("drop", (e) => {
	e.preventDefault()
	var file = e.dataTransfer.files[0]
	fromDropZone.style.backgroundColor = "#FFF1D8"
	if (isLmsp(file)) {
		fromFile = file
		fromP.innerHTML = fromFile.name
	} else {
		alert("The file you provided is not .lmsp or .llsp3")
	}
})

fromDropZone.onmousedown = function (e) {
	const input = document.createElement("input")
	input.type = "file"
	input.accept = ".lmsp,.llsp3"

	input.onchange = (e) => {
		var file = e.target.files[0]
		if (isLmsp(file)) {
			fromFile = file
			fromP.innerHTML = fromFile.name
		} else {
			alert("The file you provided is not .lmsp or .llsp3")
		}
	}

	input.click()
}

const showError = (text) => {
	errorHandler.innerHTML = text
	setTimeout(() => {
		errorHandler.innerHTML = ""
	}, 2000)
}

const processFunc = function () {
	var zip = new JSZip()
	zip
		.loadAsync(fromFile)
		.then(function () {
			var scratchZip = zip.file("scratch.sb3")

			if (scratchZip) {
				return scratchZip.async("uint8array").then(function (scratchData) {
					var scratch = new JSZip()
					return scratch.loadAsync(scratchData).then(function () {
						return scratch.file("project.json").async("string")
					})
				})
			} else {
				throw new Error("Scratch zip (from) file not found.")
			}
		})
		.then(function (projectJson) {
			fromJSON = JSON.parse(projectJson)
			var szip = new JSZip()
			szip
				.loadAsync(sourceFile)
				.then(function () {
					var scratchZip = szip.file("scratch.sb3")

					if (scratchZip) {
						return scratchZip.async("uint8array").then(function (scratchData) {
							var scratch = new JSZip()
							return scratch.loadAsync(scratchData).then(function () {
								return scratch.file("project.json").async("string")
							})
						})
					} else {
						throw new Error("Scratch zip (source) file not found.")
					}
				})
				.then(function (projectJson) {
					sourceJSON = JSON.parse(projectJson)
				})
				.catch(function (error) {
					console.error(error)
				})
		})
		.catch(function (error) {
			console.error(error)
		})
}

const mergeFiles = async() => {
	const variables = Object.assign(
		{},
		sourceJSON["targets"][1]["variables"],
		fromJSON["targets"][1]["variables"]
	)
	const lists = Object.assign(
		{},
		sourceJSON["targets"][1]["lists"],
		fromJSON["targets"][1]["lists"]
	)
	const broadcasts = Object.assign(
		{},
		sourceJSON["targets"][0]["broadcasts"],
		fromJSON["targets"][0]["broadcasts"]
	)
	const blocks = Object.assign(
		{},
		sourceJSON["targets"][1]["blocks"],
		fromJSON["targets"][1]["blocks"]
	)
	const comments = Object.assign(
		{},
		sourceJSON["targets"][1]["comments"],
		fromJSON["targets"][1]["comments"]
	)
	const extensions = sourceJSON["extensions"].concat(fromJSON["extensions"])

	var finalJson = sourceJSON
	finalJson["targets"][1]["variables"] = variables
	finalJson["targets"][1]["lists"] = lists
	finalJson["targets"][0]["broadcasts"] = broadcasts
	finalJson["targets"][1]["blocks"] = blocks
	finalJson["targets"][1]["comments"] = comments
	finalJson["extensions"] = extensions

	console.log(finalJson)

	var zip = new JSZip()
	const sourceZip = await zip.loadAsync(sourceFile)
	var szip = new JSZip()
	console.log(sourceZip.files["scratch.sb3"])
	const scratchFile = await zip.file("scratch.sb3").async("blob")
	const scratchZip = await szip.loadAsync(scratchFile)

	const projectJson = await scratchZip.file("project.json").async("string")
	await scratchZip.file("project.json",JSON.stringify(finalJson))

	const updatedScratchZip = await scratchZip.generateAsync({ type: "blob"})
	await sourceZip.file("scratch.sb3",updatedScratchZip)

	const updatedZip = await sourceZip.generateAsync({ type: "blob"})
	const url = URL.createObjectURL(updatedZip)
	const link = document.createElement("a")
	link.href = url
	const newFileName = "Merged-" + sourceFile.name
	link.download = newFileName
	link.click()
	alert('Your file has been downloaded as "' + "Merged-" + sourceFile.name + '"')
	}

processFiles.onmousedown = async function (e) {
	if (typeof sourceFile === "undefined") {
		showError("Please select a main file")
	} else {
		if (typeof fromFile === "undefined") {
			showError("Please select a file to copy from")
		} else {
			processFunc()
			setTimeout(async () => {
				console.log(sourceJSON)
				console.log(fromJSON)
				await mergeFiles()
			}, 100)
		}
	}
}
