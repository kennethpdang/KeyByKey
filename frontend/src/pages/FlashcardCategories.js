import React, { useState, useRef, useEffect } from 'react';
import '../cascading_style_sheets/FlashcardCategories.css';

const categories = [
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'Science' },
  { id: 3, name: 'History' },
  { id: 4, name: 'Literature' },
  { id: 5, name: 'Scripture' },
  { id: 6, name: 'Programming' },
];

const FlashcardCategories = () => {
  const [showForm, setShowForm] = useState(false);
  const [categoryHeader, setCategoryHeader] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const formRef = useRef(null);

  const toggleForm = () => {
    setShowForm(prev => !prev);
  };

  // Close the form when clicking outside of it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setShowForm(false);
      }
    };

    if (showForm) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showForm]);

  const handleHeaderChange = (e) => {
    setCategoryHeader(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setCategoryDescription(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // (Future: post new category to MongoDB)
    console.log("New Category:", categoryHeader, categoryDescription);
    setCategoryHeader("");
    setCategoryDescription("");
    setShowForm(false);
  };

  return (
    <div className="flashcard-categories-container">
      <div className={`flashcard-categories ${showForm ? 'shifted' : ''}`}>
        <div className="categories-header">
          <h2>Flashcard Categories</h2>
          <button className="add-category-button" onClick={toggleForm}>
            <i className="fas fa-plus"></i>
          </button>
        </div>
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              <div className="category-item">
                <div className="category-icon">
                  <i className="fas fa-folder"></i>
                </div>
                <div className="category-name">{category.name}</div>
                <div className="category-arrow">
                  <i className="fas fa-chevron-right"></i>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {showForm && (
        <div className="flashcard-category-form" ref={formRef}>
          <div className="form-header">
            <h2>Add New Category</h2>
            <button className="close-form-button" onClick={toggleForm}>
              <i className="fas fa-plus"></i>
            </button>
          </div>
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label htmlFor="categoryHeader">Category Header</label>
              <input
                type="text"
                id="categoryHeader"
                maxLength="200"
                value={categoryHeader}
                onChange={handleHeaderChange}
                placeholder="Enter category title"
              />
            </div>
            <div className="form-group">
              <label htmlFor="categoryDescription">Category Description</label>
              <textarea
                id="categoryDescription"
                maxLength="750"
                value={categoryDescription}
                onChange={handleDescriptionChange}
                placeholder="Enter category description"
              />
              <div className={`char-count ${categoryDescription.length >= 600 ? 'warning' : ''}`}>
                {categoryDescription.length}/750
              </div>
            </div>
            <button type="submit" className="submit-button">Add Category</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FlashcardCategories;