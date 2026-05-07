#!/bin/bash
# 批量生成预设问题回答和语音

KEY="sk-2eb74d99ccfd44ef9d4d6a5e4781ebb5"
OUTPUT_DIR="../preset-data"
mkdir -p "$OUTPUT_DIR"

# 预设问题
questions=(
  "吴先生，您是如何发现宇称不守恒的？"
  "做科研最重要的是什么？"
  "您对中国科学发展有什么期望？"
  "您对年轻人有什么寄语？"
  "您在求学过程中遇到过什么困难？"
  "您和费米、奥本海默等科学家有什么交流？"
  "您如何看待诺贝尔奖？"
  "您对中国女性科研工作者有什么建议？"
)

ids=(
  "preset_q001"
  "preset_q002"
  "preset_q003"
  "preset_q004"
  "preset_q005"
  "preset_q006"
  "preset_q007"
  "preset_q008"
)

SYSTEM_PROMPT="你是吴健雄，核物理学家。用第一人称回答，简洁亲切，不超过80字。"

for i in "${!questions[@]}"; do
  id="${ids[$i]}"
  question="${questions[$i]}"
  echo ""
  echo "处理: $question"
  
  # 1. 生成文字
  echo "  生成文字..."
  text_response=$(curl -s -X POST https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $KEY" \
    -d "{\"model\":\"qwen-plus\",\"messages\":[{\"role\":\"system\",\"content\":\"$SYSTEM_PROMPT\"},{\"role\":\"user\",\"content\":\"$question\"}],\"max_tokens\":128}")
  
  text=$(echo "$text_response" | grep -o '"content":"[^"]*"' | head -1 | sed 's/"content":"//;s/"$//')
  
  if [ -z "$text" ]; then
    echo "  ✗ 文字生成失败"
    continue
  fi
  
  echo "  文字: ${text:0:50}..."
  
  # 2. 生成语音（异步任务）
  echo "  提交语音任务..."
  tts_submit=$(curl -s -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/audioGeneration \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $KEY" \
    -d "{\"model\":\"sambert-zhichu-v1\",\"input\":{\"text\":\"$text\"},\"parameters\":{\"voice\":\"zhichu\",\"volume\":50,\"speech_rate\":0,\"pitch_rate\":0}}")
  
  task_id=$(echo "$tts_submit" | grep -o '"task_id":"[^"]*"' | head -1 | sed 's/"task_id":"//;s/"$//')
  
  if [ -z "$task_id" ]; then
    echo "  ⚠ 语音任务提交失败，仅保存文字"
    audio_base64=""
  else
    echo "  语音任务: $task_id，等待完成..."
    
    # 轮询等待
    for j in {1..30}; do
      sleep 1
      tts_result=$(curl -s "https://dashscope.aliyuncs.com/api/v1/tasks/$task_id" \
        -H "Authorization: Bearer $KEY")
      
      status=$(echo "$tts_result" | grep -o '"task_status":"[^"]*"' | head -1 | sed 's/"task_status":"//;s/"$//')
      
      if [ "$status" = "SUCCEEDED" ]; then
        audio_base64=$(echo "$tts_result" | grep -o '"audio":"[^"]*"' | head -1 | sed 's/"audio":"//;s/"$//')
        echo "  语音生成完成"
        break
      elif [ "$status" = "FAILED" ]; then
        echo "  ⚠ 语音生成失败，仅保存文字"
        audio_base64=""
        break
      fi
    done
    
    if [ -z "$audio_base64" ]; then
      echo "  ⚠ 语音生成超时，仅保存文字"
    fi
  fi
  
  # 3. 保存
  cat > "$OUTPUT_DIR/$id.json" << EOF
{
  "id": "$id",
  "question": "$question",
  "text": "$text",
  "audioBase64": "$audio_base64",
  "createdAt": "$(date -Iseconds)"
}
EOF
  
  echo "  ✓ 已保存到 preset-data/$id.json"
done

echo ""
echo "全部完成！请将 preset-data/ 下的文件上传到云存储。"
