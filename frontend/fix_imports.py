with open('src/components/PlaceholderViews.tsx', 'r') as f:
    lines = f.readlines()

# Remove the very first line which is the one I injected
if lines[0].startswith("import { User, Shield,"):
    lines.pop(0)

# Make sure User, Shield, LinkIcon, Calendar are imported inside the big lucide-react block
import re
new_code = "".join(lines)
new_code = new_code.replace("Building,", "User, Shield, Link as LinkIcon, Calendar, Building,")
new_code = new_code.replace("Lock, Bell, CreditCard,  ArrowRight,", "Lock, Bell, ArrowRight,")

with open('src/components/PlaceholderViews.tsx', 'w') as f:
    f.write(new_code)
