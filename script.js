import { GoogleGenerativeAI } from 'https://cdn.jsdelivr.net/npm/@google/generative-ai@0.21.0/+esm'
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

const genAI = new GoogleGenerativeAI('AIzaSyAEBht3f6B4fivMN57sV778hmFW1c3SYkE');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

let history = [
    {
        role:'model',
        parts:[{text:"Sen insanların hem asistanı hemde bir arkadaşısın, ismin ise 'AI'. Sana adın soruluyorsa, isminin AI olduğunu bilerekten bir cümle kurmalısın. Her defasında kendini tanıtma sohbete dayalı cevaplar ver."}]
    }
]

if(!window.localStorage.getItem('AI-chats')) window.localStorage.setItem('AI-chats','[]');

let selectedChat = `chat-${JSON.parse(window.localStorage.getItem('AI-chats')).length + 1}`

const submitButton = document.getElementById('submitButton')
const input = document.getElementById('input')

async function sendHistoryMessage(sendMessage){
    history.push({
        role:'user',
        parts:[{text:sendMessage}]
    })
    const result = await model.generateContent({ contents: history })
    history.push({
        role:'model',
        parts:[{text: result.response.text()}]
    })

    return result.response.text()
}

submitButton.onclick = async () => {
    const userMessage = input.value

    if(userMessage.trim() == '') return;

    if(document.getElementById('h1')) document.getElementById('h1').remove()
    document.querySelectorAll('.chatDiv')[0].style.display = 'block'

    const userMessageDiv = document.createElement('div')
    userMessageDiv.className = 'userMessageDiv'
    userMessageDiv.textContent = userMessage
    document.getElementById('chatHistory').append(userMessageDiv)
    document.getElementById('chatHistory').scrollTo(0, document.getElementById('chatHistory').scrollHeight);

    input.value = ''
    submitButton.disabled = true
    submitButton.style.cursor = 'not-allowed'

    const response = await sendHistoryMessage(userMessage)
    const AIMessageDiv = document.createElement('div')
    AIMessageDiv.className = 'modelMessageDiv'
    AIMessageDiv.innerHTML = marked.parse(response).replace(/<p>(.*?)<\/p>/g, '<span>$1</span>');
    document.getElementById('chatHistory').append(AIMessageDiv)
    document.getElementById('chatHistory').scrollTo(0, document.getElementById('chatHistory').scrollHeight);

    submitButton.disabled = false
    submitButton.style.cursor = 'pointer'

    const historyChatArr = JSON.parse(window.localStorage.getItem('AI-chats'))
    
    if(!historyChatArr.find(chat => chat.name == selectedChat)){
        historyChatArr.push({
            name:selectedChat,
            history: history
        })

        window.localStorage.setItem('AI-chats',JSON.stringify(historyChatArr))

        return;
    }

    historyChatArr.find(chat => chat.name == selectedChat).history = history
    window.localStorage.setItem('AI-chats',JSON.stringify(historyChatArr))
}

input.addEventListener('keydown',e => {
    if(e.key == 'Enter'){
        e.preventDefault()
        submitButton.click()
    }
})

window.addEventListener('DOMContentLoaded',() => {
    const chats = JSON.parse(window.localStorage.getItem('AI-chats'))
    
    chats.forEach(element => {
        const chatDiv = document.createElement('div')
        chatDiv.className = 'chat'
        chatDiv.innerHTML = `<h1>${element.name}</h1>`

        chatDiv.onclick = () => {
            const chatHistory = chats.find(chat => chat.name == element.name).history
            history = chatHistory
            selectedChat = element.name

            document.getElementById('chatHistory').innerHTML = ''
            
            history.forEach(chatData => {
                const userMessage = document.createElement('div')

                userMessage.className = `${chatData.role}MessageDiv`
                userMessage.innerHTML = marked.parse(chatData.parts[0].text).replace(/<p>(.*?)<\/p>/g, '<span>$1</span>');

                document.getElementById('chatHistory').append(userMessage)
            })
            document.querySelectorAll('.modelMessageDiv')[0].remove()
            document.getElementById('chatHistory').scrollTo(0, document.getElementById('chatHistory').scrollHeight);
        }

        document.getElementById('AI-chats').append(chatDiv)
    })
})