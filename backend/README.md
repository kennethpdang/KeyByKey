# Understanding the Backend Folder
The file structure of the backend folder appears as so:
```
📁 backend/
├── 📁 controllers/
│   ├── 📜 collectionController.js
│   ├── 📜 flashcardController.js
│
├── 📁 models/
│   ├── 📜 collectionModel.js
│   ├── 📜 flashcardModel.js
│
├── 📁 routes/
│   ├── 📜 collection.js
│   ├── 📜 flashcard.js
│
├── 📁 services/
│   ├── 📜 collectionServices.js
│   ├── 📜 flashcardServices.js
│
│ 📜 server.js
│ 📜 README.md
```

Here is the idea of the file structure. We are trying to both implement DRY and SOLID principles (which are good software development principles). DRY code means to do-not-repeat yourself. And SOLID is an acronym developed by software engineer Robert C. Martin. It stands for:
1. Single Responsibility Principle

So in honor of the single responsibility principle where each file does one specfic task we decided to implement the file structure above. So our `models` folder is designed to handle mongoose related activities like schemas. Our services is to actually handle our mongodb queries. Our controllers are to handle HTTP requests. And the routes are to simplify things to export.