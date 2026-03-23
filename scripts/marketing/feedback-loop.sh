#!/bin/bash
# feedback-loop.sh — Larry-inspired analytics feedback loop for Resteeped social posts
# Pulls Postiz analytics, categorizes performance, outputs actionable insights
# Run daily or weekly to close the create→measure→iterate loop
#
# Usage: ./scripts/marketing/feedback-loop.sh [--days 7] [--json]

set -euo pipefail

DAYS="${1:-7}"
JSON_OUTPUT=false

if [[ "${2:-}" == "--json" ]] || [[ "${1:-}" == "--json" ]]; then
  JSON_OUTPUT=true
  [[ "${1:-}" == "--json" ]] && DAYS=7
fi

START_DATE=$(date -v-${DAYS}d -u +"%Y-%m-%dT00:00:00Z" 2>/dev/null || date -d "${DAYS} days ago" -u +"%Y-%m-%dT00:00:00Z")
END_DATE=$(date -u +"%Y-%m-%dT23:59:59Z")

echo "📊 Resteeped Marketing Feedback Loop"
echo "Period: last ${DAYS} days"
echo "---"

# Get all posts in the date range
POSTS_JSON=$(postiz posts:list --startDate "$START_DATE" --endDate "$END_DATE" 2>/dev/null | tail -n +2)

POST_COUNT=$(echo "$POSTS_JSON" | jq '.posts | length')

if [[ "$POST_COUNT" == "0" ]]; then
  echo "No posts found in the last ${DAYS} days."
  exit 0
fi

echo "Found ${POST_COUNT} posts"
echo ""

# For each post, pull analytics and categorize
echo "$POSTS_JSON" | jq -r '.posts[] | .id' | while read -r POST_ID; do
  # Get post details
  CONTENT=$(echo "$POSTS_JSON" | jq -r ".posts[] | select(.id==\"$POST_ID\") | .content" | head -c 100)
  PLATFORM=$(echo "$POSTS_JSON" | jq -r ".posts[] | select(.id==\"$POST_ID\") | .integration.providerIdentifier")
  STATE=$(echo "$POSTS_JSON" | jq -r ".posts[] | select(.id==\"$POST_ID\") | .state")
  RELEASE_URL=$(echo "$POSTS_JSON" | jq -r ".posts[] | select(.id==\"$POST_ID\") | .releaseURL")
  PUB_DATE=$(echo "$POSTS_JSON" | jq -r ".posts[] | select(.id==\"$POST_ID\") | .publishDate")

  # Pull analytics
  ANALYTICS=$(postiz analytics:post "$POST_ID" -d "$DAYS" 2>/dev/null | tail -n +2)

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📱 Platform: ${PLATFORM}"
  echo "📅 Published: ${PUB_DATE}"
  echo "📝 Content: ${CONTENT}..."
  echo "🔗 URL: ${RELEASE_URL}"
  echo "📊 State: ${STATE}"
  
  # Parse analytics if available
  if [[ "$ANALYTICS" != "[]" && -n "$ANALYTICS" ]]; then
    echo "📈 Analytics:"
    echo "$ANALYTICS" | jq -r '
      .[] | "   Views: \(.views // "n/a") | Likes: \(.likes // "n/a") | Comments: \(.comments // "n/a") | Shares: \(.shares // "n/a")"
    ' 2>/dev/null || echo "   (parsing error)"
    
    # Calculate engagement rate if views > 0
    VIEWS=$(echo "$ANALYTICS" | jq '[.[].views // 0] | add' 2>/dev/null || echo 0)
    LIKES=$(echo "$ANALYTICS" | jq '[.[].likes // 0] | add' 2>/dev/null || echo 0)
    COMMENTS=$(echo "$ANALYTICS" | jq '[.[].comments // 0] | add' 2>/dev/null || echo 0)
    
    if [[ "$VIEWS" -gt 0 ]] 2>/dev/null; then
      ENGAGEMENT=$(echo "scale=2; ($LIKES + $COMMENTS) * 100 / $VIEWS" | bc 2>/dev/null || echo "n/a")
      echo "   Engagement rate: ${ENGAGEMENT}%"
      
      # Larry Loop classification
      if [[ "$VIEWS" -lt 100 ]]; then
        echo "   🔴 HOOK FAILURE — low views. Test different opening hook."
      elif [[ "$ENGAGEMENT" != "n/a" ]] && (( $(echo "$ENGAGEMENT < 2" | bc -l 2>/dev/null || echo 0) )); then
        echo "   🟡 ENGAGEMENT FAILURE — views OK but low interaction. Content doesn't resonate."
      else
        echo "   🟢 PERFORMING — keep iterating on this format."
      fi
    fi
  else
    echo "📈 Analytics: Not yet available (too recent or no data)"
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 SUMMARY"
echo "Total posts: ${POST_COUNT}"
echo ""
echo "💡 NEXT ACTIONS (Larry Loop):"
echo "1. For HOOK FAILURES: Research top-performing tea content on TikTok/Reddit"
echo "2. For ENGAGEMENT FAILURES: Test different CTAs and content angles"
echo "3. For PERFORMING posts: Create 3-5 variations of the same format"
echo "4. Check App Store Connect for download correlation with post dates"
