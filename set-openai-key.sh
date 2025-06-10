#!/bin/bash
echo "Setting up OpenAI API key for PGMN-Ops..."
sed -i "" "s/REPLACE_WITH_YOUR_OPENAI_API_KEY/$1/" .env
echo "✅ OpenAI API key has been set! You can now run: npm run dev"
