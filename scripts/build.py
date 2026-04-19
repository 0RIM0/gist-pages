import sys
from pathlib import Path

def replace_file(filepath, replace_dict):
	path = Path(filepath)

	if not path.is_file():
		raise Exception(f"{file_path} がファイルではありません")

	content = path.read_text(encoding="utf-8")

	for src, dst in replace_dict.items():
		content = content.replace(src, dst)

	path.write_text(content, encoding="utf-8")

replace_file("public/404.html", { "{{deploy_root}}": sys.argv[1] })
