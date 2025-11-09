"""
Message Categorization Utility
"""
from typing import Dict, List
import re


class MessageCategorizer:
    """Categorize messages based on content analysis"""

    # Category keywords mapping
    CATEGORIES = {
        "Product Info": [
            "product", "specification", "specs", "features", "detail", "model",
            "version", "compatible", "compatibility", "dimension", "size", "weight",
            "color", "available", "stock", "price", "cost", "how much"
        ],
        "Shipping": [
            "ship", "shipping", "delivery", "deliver", "tracking", "track",
            "courier", "fedex", "ups", "dhl", "postal", "arrive", "arrival",
            "shipping fee", "shipping cost", "international shipping"
        ],
        "Returns": [
            "return", "refund", "exchange", "replace", "replacement",
            "send back", "money back", "cancel", "cancellation"
        ],
        "Warranty": [
            "warranty", "guarantee", "covered", "coverage", "repair",
            "defect", "broken", "damage", "faulty", "malfunction"
        ],
        "Payment": [
            "payment", "pay", "credit card", "debit card", "paypal",
            "payment method", "installment", "financing", "charge"
        ],
        "Account": [
            "account", "login", "password", "register", "sign up",
            "profile", "email", "username", "forgot password"
        ],
        "Order Status": [
            "order", "order status", "order number", "confirmation",
            "received", "processing", "shipped", "delivered"
        ],
        "Technical Support": [
            "not working", "error", "problem", "issue", "help",
            "troubleshoot", "fix", "support", "configure", "setup"
        ],
        "General": []  # Default category
    }

    @classmethod
    def categorize(cls, message: str) -> Dict[str, any]:
        """
        Categorize a message based on its content

        Args:
            message: The message text to categorize

        Returns:
            Dict containing category, confidence, and matched keywords
        """
        message_lower = message.lower()

        # Count matches for each category
        category_scores = {}
        matched_keywords = {}

        for category, keywords in cls.CATEGORIES.items():
            if category == "General":
                continue

            score = 0
            matches = []

            for keyword in keywords:
                # Use word boundaries for better matching
                pattern = r'\b' + re.escape(keyword) + r'\b'
                if re.search(pattern, message_lower):
                    score += 1
                    matches.append(keyword)

            if score > 0:
                category_scores[category] = score
                matched_keywords[category] = matches

        # Determine best category
        if category_scores:
            best_category = max(category_scores.items(), key=lambda x: x[1])
            category_name = best_category[0]
            score = best_category[1]

            # Calculate confidence (normalize to 0-1 range)
            # More keywords matched = higher confidence
            confidence = min(score / 3, 1.0)  # Cap at 1.0, normalize by 3 keywords

            return {
                "category": category_name,
                "confidence": round(confidence, 2),
                "keywords": matched_keywords[category_name]
            }
        else:
            return {
                "category": "General",
                "confidence": 1.0,
                "keywords": []
            }

    @classmethod
    def categorize_batch(cls, messages: List[str]) -> List[Dict[str, any]]:
        """Categorize multiple messages"""
        return [cls.categorize(msg) for msg in messages]
