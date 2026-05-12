import os
import re

def find_hook_violations(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                continue
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Split into functions (heuristic)
            blocks = re.split(r'function\s+\w+\s*\(.*?\)[\s:]*\{|const\s+\w+\s*=\s*\(.*?\)[\s:]*=>\s*\{', content)
            if len(blocks) < 2:
                continue
            
            for i in range(1, len(blocks)):
                block = blocks[i]
                lines = block.split('\n')
                has_returned = False
                for line_num, line in enumerate(lines, 1):
                    stripped = line.strip()
                    if stripped.startswith('return ') and not stripped.startswith('return (') and not '{' in stripped:
                        # Might be an early return, but we need to check if it's inside an inner block
                        # This is a very rough heuristic.
                        has_returned = True
                    if has_returned and re.search(r'\buse[A-Z]\w*\(', stripped):
                        print(f"{path}: possible hook violation on line {line.strip()}")
                        has_returned = False # reset to find more

find_hook_violations('c:/Users/uveys/OneDrive/Masaüstü/ProjeMoffi1/MoffiVercel/src')
