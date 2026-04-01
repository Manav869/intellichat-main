export const generateTitleFromMessage = (message) => {
    if (!message) return "New Chat";
    
    // Split into sentences
    const sentences = message.split(/[.!?]+/).filter(s => s.trim());
    
    if (sentences.length === 0) return "New Chat";
    
    // Get first sentence
    let title = sentences[0].trim();
    
    // If first sentence is too long, get first 3-4 significant words
    if (title.length > 50) {
        title = title.split(/\s+/).slice(0, 4).join(" ").trim();
    }
    
    // Add ellipsis if truncated
    if (title.length > 50) {
        title = title.substring(0, 47) + "...";
    }
    
    return title;
};