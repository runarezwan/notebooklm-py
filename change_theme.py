import os
import glob

def replace_colors(dir_path):
    files = glob.glob(os.path.join(dir_path, '**', '*.tsx'), recursive=True)
    for file_path in files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace colors
        new_content = content.replace('orange', 'indigo').replace('amber', 'violet')
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated colors in {file_path}")

if __name__ == '__main__':
    replace_colors('frontend/src')
