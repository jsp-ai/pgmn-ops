# AI-Powered Payroll Calculator Integration

## Overview

The PGMN Ops platform has been refactored to use OpenAI's ChatGPT for all computational logic, providing consistent calculations and guidance across both the dashboard metrics and the Slack attendance tracker.

## Features

### 🤖 AI-Powered Calculations
- **Payroll Processing**: ChatGPT handles all payroll calculations including overtime, deductions, and net pay
- **Attendance Parsing**: AI parses Slack messages into structured attendance logs with lateness detection
- **Dashboard Metrics**: Consistent metric calculations powered by AI reasoning
- **Fallback System**: Traditional calculations as backup when AI is unavailable

### 📊 Enhanced Accuracy & Consistency
- AI provides reasoning for all calculations
- Confidence scores for computational results
- Consistent logic across different features
- Detailed explanations for complex calculations

### 🔧 Robust Error Handling
- Graceful fallback to traditional calculations
- Clear error messages and warnings
- Detailed status indicators
- No data loss during AI processing failures

## Setup Instructions

### 1. OpenAI API Key
1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a `.env` file in the project root:
```bash
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Optional Configuration
You can customize the AI behavior with additional environment variables:
```bash
# Model selection (default: gpt-4-1106-preview)
VITE_OPENAI_MODEL=gpt-4-1106-preview

# Max tokens for responses (default: 4000)
VITE_OPENAI_MAX_TOKENS=4000

# Temperature for consistency (default: 0.1)
VITE_OPENAI_TEMPERATURE=0.1
```

### 3. Verification
The AI Status Indicator in the app will show:
- 🤖 **AI-powered calculations** - OpenAI is connected and working
- ❌ **AI unavailable - using fallback** - API key not set or connection failed
- ⚠️ **AI processing with fallback** - AI had issues but calculations completed

## AI-Enhanced Features

### 1. Slack Text Parser
- **Before**: Manual JSON formatting required
- **After**: Direct copy-paste from Slack with AI parsing
- **Benefits**: Handles various text formats, status recognition, employee matching

### 2. Payroll Calculations
- **Before**: Static rule-based calculations
- **After**: AI-powered calculations with reasoning
- **Benefits**: Explanations for complex scenarios, confidence scoring

### 3. Dashboard Metrics
- **Before**: Simple aggregation functions
- **After**: AI-computed metrics with context
- **Benefits**: Consistent calculations, detailed reasoning

## Business Logic Powered by AI

### Payroll Rules (AI-enforced)
- Standard work hours: 8 hours per day
- Overtime multiplier: 1.5x after regular hours
- Late grace period: 5 minutes
- Late deduction: $10 per late day
- Offline deduction: $50 per offline day

### Attendance Parsing (AI-enhanced)
- Recognizes various status formats ("IN", "in", "In")
- Handles approved absences ("OUT - JSP Approved")
- Processes ETA messages ("ETA 9:55 with team")
- Detects Work From Home status ("WFH")
- Identifies no-show employees

### Dashboard Calculations (AI-computed)
- Active employee counts
- Attendance rates and patterns
- Total deductions and overtime
- Performance metrics and trends

## Error Handling & Fallbacks

### AI Unavailable
When OpenAI API is not available:
1. System automatically falls back to traditional calculations
2. Users see clear indicators about fallback mode
3. All functionality remains available
4. No data loss or calculation errors

### Partial AI Failures
When AI processing encounters issues:
1. Individual calculation steps fall back independently
2. Mixed results clearly indicated to users
3. Confidence scores reflect reliability
4. Detailed error messages for troubleshooting

## Monitoring & Debugging

### AI Status Indicators
- Connection status (connected/disconnected)
- Confidence levels for calculations
- Reasoning explanations
- Error details and fallback notifications

### Console Logging
- AI request/response debugging
- Fallback trigger warnings
- Performance timing information
- Error stack traces

## Cost Considerations

### Token Usage
- Optimized prompts minimize token consumption
- Structured JSON responses reduce parsing overhead
- Caching prevents redundant API calls
- Fallback reduces unnecessary AI usage

### Performance
- Asynchronous processing for non-blocking UI
- Local caching of AI responses
- Efficient batch processing for large datasets
- Progressive enhancement approach

## Future Enhancements

### Planned Features
- AI-powered attendance anomaly detection
- Predictive analytics for payroll forecasting
- Natural language querying of payroll data
- Automated compliance checking

### Optimization Opportunities
- Response caching for repeated calculations
- Batch processing for efficiency
- Model fine-tuning for domain-specific accuracy
- Integration with additional AI providers

## Troubleshooting

### Common Issues

1. **"AI unavailable" message**
   - Check VITE_OPENAI_API_KEY environment variable
   - Verify API key validity on OpenAI platform
   - Check network connectivity

2. **"AI processing with fallback" warnings**
   - Review console for detailed error messages
   - Check API rate limits and usage
   - Verify request format in network tab

3. **Inconsistent calculations**
   - Check confidence scores in AI status
   - Review AI reasoning explanations
   - Compare with fallback calculations

### Support
For technical issues or questions about the AI integration:
1. Check the AI Status Indicator for diagnostic information
2. Review browser console for detailed error logs
3. Test with fallback mode to isolate AI-specific issues
4. Contact the development team with specific error messages

---

**Note**: This AI integration maintains full backward compatibility. The system will continue to function with traditional calculations if OpenAI integration is not configured. 