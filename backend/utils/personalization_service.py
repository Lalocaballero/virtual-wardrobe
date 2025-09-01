from collections import Counter

def summarize_feedback_for_ai(feedback_history):
    """
    Analyzes a user's packing list feedback history and creates a concise
    natural language summary for the AI.
    """
    if not feedback_history:
        return "No feedback history available."

    num_trips = len(feedback_history)
    avg_rating = sum(f.rating for f in feedback_history if f.rating is not None) / num_trips
    
    all_unused_items = []
    for f in feedback_history:
        if f.unused_items:
            all_unused_items.extend(f.unused_items)
            
    unused_item_counts = Counter(all_unused_items)
    frequently_unused = [item for item, count in unused_item_counts.items() if count / num_trips > 0.5]

    # Basic sentiment analysis on comments
    positive_keywords = ['good', 'great', 'loved', 'perfect', 'excellent']
    negative_keywords = ['bad', 'poor', 'missing', 'needed', 'wish']
    
    comments = [f.comments.lower() for f in feedback_history if f.comments]
    positive_comments = sum(any(kw in c for kw in positive_keywords) for c in comments)
    negative_comments = sum(any(kw in c for kw in negative_keywords) for c in comments)

    # Build the summary string
    summary_parts = []
    summary_parts.append(f"Based on the last {num_trips} trips:")
    summary_parts.append(f"- The user's average packing list rating is {avg_rating:.1f}/5.")

    if frequently_unused:
        summary_parts.append(f"- The user frequently does not use the following items: {', '.join(frequently_unused)}. Consider packing these less often.")

    if positive_comments > negative_comments:
        summary_parts.append("- User comments are generally positive.")
    elif negative_comments > positive_comments:
        summary_parts.append("- User comments are often negative, suggesting lists may be missing items or poorly suited.")
        
    if not summary_parts:
        return "No significant patterns found in feedback history."

    return " ".join(summary_parts)
