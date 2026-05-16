import io
import os
import sys

def strip_comments(code: str) -> str:
    out_chars = []
    i = 0
    n = len(code)
    state = 'code'
    string_delim = None
    while i < n:
        ch = code[i]
        nxt = code[i+1] if i+1 < n else ''
        if state == 'code':
            if ch == '/' and nxt == '/':
                state = 'line_comment'
                i += 2
                continue
            if ch == '/' and nxt == '*':
                state = 'block_comment'
                i += 2
                continue
            if ch in ('"', "'", '`'):
                string_delim = ch
                out_chars.append(ch)
                state = 'string'
                i += 1
                continue
            out_chars.append(ch)
            i += 1
        elif state == 'line_comment':
            if ch == '\n':
                out_chars.append(ch)
                state = 'code'
            i += 1
        elif state == 'block_comment':
            if ch == '*' and nxt == '/':
                state = 'code'
                i += 2
            else:
                i += 1
        elif state == 'string':
            out_chars.append(ch)
            if ch == '\\':
                if i+1 < n:
                    out_chars.append(code[i+1])
                    i += 2
                    continue
            elif ch == string_delim:
                state = 'code'
            i += 1
    return ''.join(out_chars)


def process(root):
    changed = []
    for dirpath, dirnames, filenames in os.walk(root):
        for fname in filenames:
            if fname.endswith('.js') or fname.endswith('.ts'):
                path = os.path.join(dirpath, fname)
                try:
                    with io.open(path, 'r', encoding='utf-8') as f:
                        src = f.read()
                except Exception:
                    continue
                stripped = strip_comments(src)
                if stripped != src:
                    with io.open(path, 'w', encoding='utf-8') as f:
                        f.write(stripped)
                    changed.append(path)
    return changed

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else 'node-express-app/src'
    changed = process(root)
    if changed:
        print('Modified files:')
        for p in changed:
            print(p)
    else:
        print('No files changed')
