const fromDropzone = document.querySelector(".from-dropzone")
const srcDropzone = document.querySelector(".src-dropzone")
const projectSelect = document.querySelector("#fileType")
const processButton = document.querySelector(".process")

let content = {
	fromJson: undefined,
	srcJson: undefined,
	type: ".lmsp",
	fromFile: undefined,
	srcFile: undefined
}

function isCurrentType(filename) {
	return filename.split(".").pop() == projectSelect.value
}

function resetFiles() {
	content.fromFile = undefined
	content.srcFile = undefined
	content.fromJson = undefined
	content.srcJson = undefined
	// Text
	fromDropzone.textContent = "From"
	srcDropzone.textContent = "To"
}

function selectProject(name, target) {
	const input = document.createElement("input")
	input.type = "file"
	input.accept = content.type
	input.onchange = (e) => {
		const file = e.target.files[0]
		if (isCurrentType(file.name)) {
			target.textContent = file.name
			content[name] = file
			return file
		} else {
			alert(`The provided file is not of type "${content.type}"`)
		}
	}
	input.click()
}

function dropProject(name, e) {
	e.preventDefault()
	const file = e.dataTransfer.files[0]
	if (isCurrentType(file.name)) {
		e.target.textContent = file.name
		content[name] = file
		return file
	} else {
		alert(`The provided file is not of type "${content.type}"`)
	}
}

projectSelect.addEventListener("change", (e) => {
	content.type = e.target.value
	resetFiles()
})

// Pick file
fromDropzone.addEventListener("click", (e) => {
	selectProject("fromFile", e.target)
})

srcDropzone.addEventListener("click", (e) => {
	selectProject("srcFile", e.target)
})

// Drag n drop
fromDropzone.addEventListener("dragover", (e) => {
	e.preventDefault()
})
fromDropzone.addEventListener("drop", (e) => {
	content.fromFile = dropProject("fromFile", e)
})

srcDropzone.addEventListener("drop", (e) => {
	content.srcFile = dropProject("srcFile", e)
})
srcDropzone.addEventListener("dragover", (e) => {
	e.preventDefault()
})

async function processFiles() {
	
}

// Processing
processButton.addEventListener("click", async(e) => {
	if (content.srcFile == null || content.fromFile == null) {
		alert("Please provide 2 files.")
		return
	}
})