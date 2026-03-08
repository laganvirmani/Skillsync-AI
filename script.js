// ================================
// API URL
// ================================
const API_URL = "http://127.0.0.1:5000/api"

// ================================
// INTERVIEW STATE
// ================================
let interviewState = {
    currentQuestion: 0,
    totalQuestions: 5,
    resumeScore: 0,
    voiceScore: 0,
    overallScore: 0,
    uploadedFile: null,
    micActive: false,
    interviewStartTime: null,
    interviewEndTime: null,
    strengths: [],
    weaknesses: []
}

// ================================
// NAVIGATION FUNCTIONS
// ================================

function showSection(sectionName, event) {

    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active")
        section.style.display = "none"
    })

    const selectedSection = document.getElementById(sectionName + "Section")

    if (selectedSection) {
        selectedSection.style.display = "block"
        selectedSection.classList.add("active")
    }

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active")
    })

    if(event) event.target.classList.add("active")
}

// ================================
// LOGIN FUNCTIONS
// ================================

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'flex'
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none'
}

function handleLogin(event) {

    event.preventDefault()

    const name = document.getElementById('name').value

    document.getElementById('userName').textContent = name
    document.getElementById('userInfo').style.display = 'flex'
    document.getElementById('loginBtn').style.display = 'none'

    closeLoginModal()
}

function logout() {

    document.getElementById('userName').textContent = ''
    document.getElementById('userInfo').style.display = 'none'
    document.getElementById('loginBtn').style.display = 'block'
}

function handleContact(event) {

    event.preventDefault()

    document.getElementById('contactMessage').textContent =
        '✅ Message sent successfully!'

    document.getElementById('contactMessage').style.color = 'var(--success)'

    event.target.reset()
}

// ================================
// FILE UPLOAD
// ================================

const fileInput = document.getElementById("fileInput")
const uploadStatus = document.getElementById("uploadStatus")

fileInput.addEventListener("change", (e) => {

    const file = e.target.files[0]

    interviewState.uploadedFile = file

    uploadStatus.innerHTML = `✅ ${file.name} selected`
})

// ================================
// START INTERVIEW
// ================================

async function startInterview() {

    if (!interviewState.uploadedFile) {

        alert("Please upload resume first")

        return
    }

    interviewState.interviewStartTime = Date.now()

    const formData = new FormData()

    formData.append("file", interviewState.uploadedFile)

    uploadStatus.innerHTML = "⏳ Uploading & analyzing..."

    try {

        const healthCheck = await fetch(`${API_URL}/health`)

        if (!healthCheck.ok) {
            throw new Error("Backend server not responding")
        }

        const response = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData
        })

        const data = await response.json()

        interviewState.resumeScore = data.resume_score

        uploadStatus.innerHTML = "✅ Resume analyzed successfully"

        setTimeout(() => {

            document.getElementById("uploadSection").style.display = "none"

            document.getElementById("interviewSection").style.display = "grid"

            createVisualizerBars()

            startVoiceVisualizer()

            loadNextQuestion()

        }, 1200)

    } catch (error) {

        uploadStatus.innerHTML = `❌ Upload failed`

        console.error(error)
    }
}

// ================================
// LOAD QUESTIONS
// ================================

async function loadNextQuestion() {

    if (interviewState.currentQuestion >= interviewState.totalQuestions) {

        endInterview()

        return
    }

    const response = await fetch(`${API_URL}/generate-question`, {
        method: "POST"
    })

    const data = await response.json()

    document.getElementById("questionText").innerText =
        `${interviewState.currentQuestion + 1}. ${data.question}`

    document.getElementById("progressIndicator").innerText =
        `Question ${interviewState.currentQuestion + 1} of ${interviewState.totalQuestions}`
}

// ================================
// NEXT QUESTION
// ================================

function nextQuestion() {

    interviewState.currentQuestion++

    loadNextQuestion()
}

// ================================
// MICROPHONE ANALYZER
// ================================

let audioContext
let analyser
let microphone
let dataArray
let isMicrophoneActive = false

async function startVoiceVisualizer() {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        audioContext = new (window.AudioContext || window.webkitAudioContext)()

        analyser = audioContext.createAnalyser()

        microphone = audioContext.createMediaStreamSource(stream)

        analyser.fftSize = 256

        const bufferLength = analyser.frequencyBinCount

        dataArray = new Uint8Array(bufferLength)

        microphone.connect(analyser)

        isMicrophoneActive = true

        interviewState.micActive = true

        visualizeAudio()

        calculateVoiceConfidence()

    } catch (error) {

        alert("Microphone permission denied")
    }
}

// ================================
// CREATE VISUALIZER
// ================================

function createVisualizerBars() {

    const visualizer = document.getElementById("visualizer")

    visualizer.innerHTML = ""

    for (let i = 0; i < 20; i++) {

        const bar = document.createElement("div")

        bar.classList.add("bar")

        visualizer.appendChild(bar)
    }
}

// ================================
// AUDIO VISUALIZER
// ================================

function visualizeAudio() {

    if (!isMicrophoneActive) return

    analyser.getByteFrequencyData(dataArray)

    const bars = document.querySelectorAll(".bar")

    for (let i = 0; i < bars.length; i++) {

        const value = dataArray[i]

        const height = (value / 255) * 150

        bars[i].style.height = height + "px"
    }

    requestAnimationFrame(visualizeAudio)
}

// ================================
// VOICE CONFIDENCE
// ================================

function calculateVoiceConfidence() {

    if (!isMicrophoneActive) return

    let sum = 0

    for (let i = 0; i < dataArray.length; i++) {

        sum += dataArray[i]
    }

    let average = sum / dataArray.length

    let confidence = Math.round((average / 255) * 100)

    document.getElementById("confidenceScore").innerText = confidence + "%"

    document.getElementById("paceScore").innerText =
        confidence > 10 ? Math.round(confidence * 1.2) : "--"

    setTimeout(calculateVoiceConfidence, 200)
}

// ================================
// END INTERVIEW
// ================================

async function endInterview() {

    interviewState.interviewEndTime = Date.now()

    isMicrophoneActive = false

    interviewState.voiceScore =
        parseInt(document.getElementById("confidenceScore").innerText)

    interviewState.overallScore = Math.round(
        (interviewState.resumeScore * 0.4) +
        (interviewState.voiceScore * 0.6)
    )

    showResults()
}

// ================================
// SHOW RESULTS (UPDATED LOGIC)
// ================================

function showResults() {

    document.getElementById("interviewSection").style.display = "none"
    document.getElementById("resultsSection").style.display = "block"

    document.getElementById("resumeScore").innerText =
        interviewState.resumeScore + "%"

    document.getElementById("voiceScore").innerText =
        interviewState.voiceScore + "%"

    document.getElementById("overallScore").innerText =
        interviewState.overallScore + "%"

    const strengthsList = document.getElementById("strengthsList")
    const weaknessesList = document.getElementById("weaknessesList")

    strengthsList.innerHTML = ""
    weaknessesList.innerHTML = ""

    let strengths = []
    let weaknesses = []

    // Resume feedback
    if (interviewState.resumeScore >= 80) {
        strengths.push("Strong resume with good structure")
    } else {
        weaknesses.push("Improve resume formatting and content")
    }

    // Voice feedback
    if (interviewState.voiceScore < 20) {
        weaknesses.push("Low voice confidence")
        weaknesses.push("Speak louder and clearer")
    }
    else if (interviewState.voiceScore < 50) {
        weaknesses.push("Improve speaking confidence")
    }
    else {
        strengths.push("Good speaking confidence")
    }

    if (strengths.length === 0) {
        strengths.push("Resume analysis completed")
    }

    strengths = strengths.slice(0,2)
    weaknesses = weaknesses.slice(0,2)

    strengths.forEach(text=>{
        const li = document.createElement("li")
        li.textContent = text
        strengthsList.appendChild(li)
    })

    weaknesses.forEach(text=>{
        const li = document.createElement("li")
        li.textContent = text
        weaknessesList.appendChild(li)
    })
}

// ================================
// RESTART
// ================================

function restartInterview() {

    location.reload()
}

// ================================
// DOWNLOAD REPORT
// ================================

async function downloadReport() {

    const element = document.querySelector(".results-container")

    const canvas = await html2canvas(element)

    const image = canvas.toDataURL("image/jpeg", 1.0)

    const link = document.createElement("a")

    link.href = image

    link.download = "skillsync-interview-report.jpg"

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)
}