with open('src/components/PlaceholderViews.tsx', 'r') as f:
    code = f.read()

# Fix the textarea defaultValue which has actual newlines inside quotes instead of \n
code = code.replace('"123 Corporate Tower, KLCC\\n50088 Kuala Lumpur\\nMalaysia"', '`123 Corporate Tower, KLCC\\n50088 Kuala Lumpur\\nMalaysia`')
# Or wait, looking at the error message, the actual file contains actual newlines inside double quotes!
import re
code = re.sub(r'defaultValue=\{"123 Corporate Tower, KLCC\n50088 Kuala Lumpur\nMalaysia"\}', 'defaultValue={`123 Corporate Tower, KLCC\\n50088 Kuala Lumpur\\nMalaysia`}', code)

with open('src/components/PlaceholderViews.tsx', 'w') as f:
    f.write(code)
