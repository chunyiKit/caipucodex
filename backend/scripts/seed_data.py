from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

from app.database import Base, SessionLocal, engine
from app.models import CookingStep, Ingredient, Menu, MenuItem, Recipe

RECIPES = [
    {
        "name": "红烧排骨", "category": "荤菜", "description": "甜咸平衡的家宴硬菜", "cooking_time": 45, "difficulty": "中等",
        "ingredients": [("排骨", "600g"), ("姜", "20g"), ("生抽", "2勺"), ("老抽", "1勺")],
        "steps": ["排骨焯水后沥干。", "炒糖色后下排骨翻匀。", "加调味料和热水焖煮 35 分钟。"],
    },
    {"name": "蒜蓉西兰花", "category": "素菜", "description": "清爽解腻的快手家常菜", "cooking_time": 15, "difficulty": "简单", "ingredients": [("西兰花", "1颗"), ("蒜", "5瓣"), ("盐", "1小勺")], "steps": ["西兰花掰小朵焯水。", "蒜末爆香。", "下西兰花翻炒调味。"]},
    {"name": "番茄炒蛋", "category": "荤菜", "description": "经典下饭菜", "cooking_time": 12, "difficulty": "简单", "ingredients": [("番茄", "2个"), ("鸡蛋", "4个"), ("盐", "1小勺")], "steps": ["鸡蛋打散炒熟。", "番茄炒软出汁。", "回锅混炒调味。"]},
    {"name": "冬瓜排骨汤", "category": "汤类", "description": "清润鲜美的例汤", "cooking_time": 50, "difficulty": "中等", "ingredients": [("冬瓜", "500g"), ("排骨", "400g"), ("姜", "15g")], "steps": ["排骨焯水。", "加姜片炖 35 分钟。", "放冬瓜再煮 15 分钟。"]},
    {"name": "清炒时蔬", "category": "素菜", "description": "当天鲜蔬随手炒", "cooking_time": 10, "difficulty": "简单", "ingredients": [("青菜", "300g"), ("蒜", "3瓣"), ("盐", "1小勺")], "steps": ["青菜洗净。", "蒜末爆香。", "大火快炒青菜。"]},
    {"name": "麻婆豆腐", "category": "荤菜", "description": "麻辣鲜香、十分下饭", "cooking_time": 18, "difficulty": "中等", "ingredients": [("豆腐", "1块"), ("牛肉末", "120g"), ("豆瓣酱", "1勺")], "steps": ["豆腐切块焯水。", "炒香牛肉末和豆瓣酱。", "下豆腐收汁。"]},
    {"name": "糖醋里脊", "category": "荤菜", "description": "外酥里嫩，酸甜开胃", "cooking_time": 30, "difficulty": "中等", "ingredients": [("里脊肉", "350g"), ("番茄酱", "2勺"), ("白糖", "2勺")], "steps": ["里脊腌制裹粉。", "下锅炸至金黄。", "裹上糖醋汁。"]},
    {"name": "凉拌黄瓜", "category": "凉菜", "description": "夏日必备清爽凉菜", "cooking_time": 8, "difficulty": "简单", "ingredients": [("黄瓜", "2根"), ("蒜", "4瓣"), ("香醋", "2勺")], "steps": ["黄瓜拍碎。", "调拌汁。", "冷藏后食用更佳。"]},
    {"name": "可乐鸡翅", "category": "荤菜", "description": "孩子也爱吃的甜香鸡翅", "cooking_time": 25, "difficulty": "简单", "ingredients": [("鸡翅", "10个"), ("可乐", "330ml"), ("生抽", "1勺")], "steps": ["鸡翅煎至两面微黄。", "倒入可乐和调料。", "收汁即可。"]},
    {"name": "鱼香茄子", "category": "素菜", "description": "酱香浓郁，口感软糯", "cooking_time": 20, "difficulty": "中等", "ingredients": [("茄子", "2根"), ("蒜", "3瓣"), ("豆瓣酱", "1勺")], "steps": ["茄子切条。", "炒软茄子。", "调入鱼香汁翻匀。"]},
    {"name": "玉米排骨汤", "category": "汤类", "description": "鲜甜温润的家常汤", "cooking_time": 60, "difficulty": "中等", "ingredients": [("玉米", "2根"), ("排骨", "500g"), ("胡萝卜", "1根")], "steps": ["排骨焯水。", "玉米胡萝卜切段。", "一起煲 50 分钟。"]},
    {"name": "蛋炒饭", "category": "主食", "description": "冰箱剩饭也能很美味", "cooking_time": 10, "difficulty": "简单", "ingredients": [("米饭", "2碗"), ("鸡蛋", "2个"), ("葱", "2根")], "steps": ["鸡蛋炒散。", "下米饭炒松。", "加葱花调味。"]},
    {"name": "香煎豆腐", "category": "素菜", "description": "外皮焦香、内里嫩滑", "cooking_time": 15, "difficulty": "简单", "ingredients": [("豆腐", "1块"), ("生抽", "1勺"), ("葱", "2根")], "steps": ["豆腐切块擦干。", "煎至两面金黄。", "淋酱汁撒葱花。"]},
    {"name": "白灼虾", "category": "荤菜", "description": "原汁原味的鲜美海鲜", "cooking_time": 12, "difficulty": "简单", "ingredients": [("虾", "500g"), ("姜", "10g"), ("料酒", "1勺")], "steps": ["水中加入姜和料酒。", "虾煮至变色。", "配蘸汁食用。"]},
    {"name": "银耳雪梨羹", "category": "甜点", "description": "润燥又温柔的甜汤", "cooking_time": 40, "difficulty": "中等", "ingredients": [("银耳", "1朵"), ("雪梨", "1个"), ("冰糖", "20g")], "steps": ["银耳泡发撕小朵。", "雪梨切块。", "小火炖煮 35 分钟。"]},
]

MENUS = [
    {"title": "周二晚餐", "offset": 2, "people_count": 3, "items": ["红烧排骨", "蒜蓉西兰花", "冬瓜排骨汤"]},
    {"title": "周末家宴", "offset": 6, "people_count": 5, "items": ["糖醋里脊", "鱼香茄子", "玉米排骨汤", "蛋炒饭"]},
    {"title": "清爽工作日晚餐", "offset": 12, "people_count": 2, "items": ["番茄炒蛋", "凉拌黄瓜", "香煎豆腐"]},
]

SVG_TEMPLATE = """<svg width='640' height='480' xmlns='http://www.w3.org/2000/svg'>
<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
<stop offset='0%' stop-color='#FF6B35'/><stop offset='100%' stop-color='#F6D365'/></linearGradient></defs>
<rect width='100%' height='100%' rx='32' fill='url(#g)'/>
<circle cx='520' cy='120' r='70' fill='rgba(255,255,255,0.25)'/>
<text x='48' y='220' font-size='48' font-family='PingFang SC, sans-serif' fill='white'>{title}</text>
<text x='48' y='280' font-size='24' font-family='PingFang SC, sans-serif' fill='white'>{subtitle}</text>
</svg>"""


def ensure_placeholder(recipe_name: str) -> str:
    upload_dir = Path(__file__).resolve().parents[1] / "uploads" / "recipes"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"seed_{recipe_name}.svg".replace("/", "_")
    file_path = upload_dir / filename
    if not file_path.exists():
        file_path.write_text(SVG_TEMPLATE.format(title=recipe_name, subtitle="CaipuCodex"), encoding="utf-8")
    return f"/uploads/recipes/{filename}"


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Recipe).count() > 0:
            print("Seed data already exists.")
            return

        recipe_map = {}
        for payload in RECIPES:
            recipe = Recipe(
                name=payload["name"],
                category=payload["category"],
                description=payload["description"],
                cooking_time=payload["cooking_time"],
                difficulty=payload["difficulty"],
                image_url=ensure_placeholder(payload["name"]),
            )
            for index, (name, amount) in enumerate(payload["ingredients"]):
                recipe.ingredients.append(Ingredient(name=name, amount=amount, sort_order=index))
            for index, description in enumerate(payload["steps"]):
                recipe.cooking_steps.append(CookingStep(step_number=index + 1, description=description, sort_order=index))
            db.add(recipe)
            db.flush()
            recipe_map[recipe.name] = recipe

        for payload in MENUS:
            menu = Menu(
                title=payload["title"],
                menu_date=date.today() - timedelta(days=payload["offset"]),
                people_count=payload["people_count"],
                is_ai_generated=False,
            )
            for index, name in enumerate(payload["items"]):
                recipe = recipe_map[name]
                menu.items.append(
                    MenuItem(
                        recipe_id=recipe.id,
                        recipe_name=recipe.name,
                        recipe_category=recipe.category,
                        image_url=recipe.image_url,
                        cooking_time=recipe.cooking_time,
                        quantity=1,
                        sort_order=index,
                    )
                )
            db.add(menu)

        db.commit()
        print("Seed data created successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
