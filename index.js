// import * as JSZip from "jszip"
const JSZip = window.JSZip

const fromDropzone = document.querySelector(".from-dropzone")
const srcDropzone = document.querySelector(".src-dropzone")
const projectSelect = document.querySelector("#fileType")
const processButton = document.querySelector(".process")

let content = {
	fromJson: undefined,
	srcJson: undefined,
	type: ".llsp3",
	fromFile: undefined,
	srcFile: undefined
}

function isCurrentType(filename) {
	return filename.split(".").pop() == projectSelect.value
}

function throwError(msg) {
	alert(msg)
	throw new Error(msg)
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

async function loadProjectJson(file) {
	// Load project json
	const projectZip = await new JSZip().loadAsync(file)
	const projectScratch = projectZip.file("scratch.sb3")
	if (!projectScratch) {
		throwError("An error occured while loading the scratch.sb3 archive.")
		return
	}
	const data = await projectScratch.async("uint8array").then(async (scratchData) => {
		const zip = await new JSZip().loadAsync(scratchData)
		const data = await zip.file("project.json").async("string")
		if (!data) {
			throwError("An error occured while loading the project.json file.")
		}
		return data
	})
	return JSON.parse(data)
}

function mergeProjectsJson(srcJson, fromJson) {
	function mergeTargets(target, index) {
		return Object.assign(
			{},
			fromJson["targets"][index][target],
			srcJson["targets"][index][target]
		)
	}
	const variables = mergeTargets("variables", 1)
	const lists = mergeTargets("lists", 1)
	const broadcasts = mergeTargets("broadcasts", 0)
	const blocks = mergeTargets("blocks", 1)
	const comments = mergeTargets("comments", 1)
	const extensions = fromJson["extensions"].concat(srcJson["extensions"])

	const mergedJson = srcJson
	mergedJson["targets"][1]["variables"] = variables
	mergedJson["targets"][1]["lists"] = lists
	mergedJson["targets"][0]["broadcasts"] = broadcasts
	mergedJson["targets"][1]["blocks"] = blocks
	mergedJson["targets"][1]["comments"] = comments
	mergedJson["extensions"] = extensions

	console.log("Merged JSON:")
	console.log(mergedJson)
	return mergedJson
}

// Processing
processButton.addEventListener("click", async (e) => {
	if (content.srcFile == null || content.fromFile == null) {
		alert("Please provide 2 files.")
		return
	}
	content.fromJson = await loadProjectJson(content.fromFile)
	content.srcJson = await loadProjectJson(content.srcFile)
	const mergedJson = await mergeProjectsJson(content.srcJson,content.fromJson)

	// Generate and download zip

	const zip = await new JSZip().loadAsync(content.srcFile)
	const scratchZip = await new JSZip().loadAsync(await zip.file("scratch.sb3").async("blob"))
	// Update project.json
	scratchZip.file("project.json",JSON.stringify(mergedJson))
	const scratchArchive = await scratchZip.generateAsync({ type: "blob"})
	// Update scratch.sb3 in the project
	zip.file("scratch.sb3",scratchArchive)

	const archive = await zip.generateAsync({ type: "blob" })
	const url = URL.createObjectURL(archive)
	const link = document.createElement("a")
	link.href = url
	link.download = `EVSpike_${content.srcFile.name}`
	link.click()
	alert(`Your merged project has been downloaded as "EVSpike_${content.srcFile.name}".`)
})