with open('src/components/ui/AuthTopBar.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() == "}  );":
        new_lines.append("}\n")
    else:
        new_lines.append(line)

with open('src/components/ui/AuthTopBar.tsx', 'w') as f:
    f.writelines(new_lines)
