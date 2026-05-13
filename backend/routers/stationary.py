from fastapi import APIRouter, Depends, HTTPException
from utils.auth import get_current_user
from utils.sheets import gas_insert, gas_update, gas_delete, gas_get_all
import time

router = APIRouter()
_inventory: list = [
    {"id": 1,  "name": "Notebooks (Single Line)", "category": "Notebooks", "stock": 150, "price": 50,  "sold": 45, "unit": "pcs"},
    {"id": 2,  "name": "Notebooks (Double Line)", "category": "Notebooks", "stock": 120, "price": 50,  "sold": 30, "unit": "pcs"},
    {"id": 3,  "name": "Graph Notebooks",         "category": "Notebooks", "stock": 80,  "price": 60,  "sold": 20, "unit": "pcs"},
    {"id": 4,  "name": "Blue Pen (Ink)",          "category": "Pens",     "stock": 200, "price": 20,  "sold": 88, "unit": "pcs"},
    {"id": 5,  "name": "Black Pen (Ink)",         "category": "Pens",     "stock": 180, "price": 20,  "sold": 65, "unit": "pcs"},
    {"id": 6,  "name": "Pencil (HB)",             "category": "Pencils",  "stock": 300, "price": 10,  "sold": 120, "unit": "pcs"},
    {"id": 7,  "name": "Eraser",                  "category": "Supplies", "stock": 250, "price": 10,  "sold": 90, "unit": "pcs"},
    {"id": 8,  "name": "Ruler (30cm)",            "category": "Supplies", "stock": 100, "price": 30,  "sold": 35, "unit": "pcs"},
    {"id": 9,  "name": "Geometry Box",            "category": "Supplies", "stock": 60,  "price": 150, "sold": 28, "unit": "pcs"},
    {"id": 10, "name": "Color Pencils Set",       "category": "Art",      "stock": 45,  "price": 120, "sold": 18, "unit": "set"},
]

@router.get("")
async def get_inventory(user=Depends(get_current_user)):
    remote = await gas_get_all("Stationary")
    return {"inventory": remote if remote else _inventory}

@router.post("")
async def add_item(data: dict, user=Depends(get_current_user)):
    item = {**data, "id": int(time.time()), "sold": 0}
    _inventory.append(item)
    await gas_insert("Stationary", item)
    return {"item": item}

@router.put("/{item_id}")
async def update_item(item_id: int, data: dict, user=Depends(get_current_user)):
    for i, item in enumerate(_inventory):
        if item["id"] == item_id:
            _inventory[i] = {**item, **data, "id": item_id}
            await gas_update("Stationary", str(item_id), _inventory[i])
            return {"item": _inventory[i]}
    raise HTTPException(404, "Item not found")

@router.delete("/{item_id}")
async def delete_item(item_id: int, user=Depends(get_current_user)):
    global _inventory
    _inventory = [i for i in _inventory if i["id"] != item_id]
    await gas_delete("Stationary", str(item_id))
    return {"deleted": True}

@router.post("/{item_id}/restock")
async def restock(item_id: int, data: dict, user=Depends(get_current_user)):
    qty = int(data.get("qty", 0))
    for i, item in enumerate(_inventory):
        if item["id"] == item_id:
            _inventory[i]["stock"] += qty
            await gas_update("Stationary", str(item_id), _inventory[i])
            return {"item": _inventory[i]}
    raise HTTPException(404, "Item not found")

@router.post("/sale")
async def record_sale(data: dict, user=Depends(get_current_user)):
    """Record a sale: {itemId, qty, studentId, studentName}"""
    item_id = int(data.get("itemId", 0))
    qty     = int(data.get("qty", 1))
    for i, item in enumerate(_inventory):
        if item["id"] == item_id:
            if item["stock"] < qty:
                raise HTTPException(400, "Insufficient stock")
            _inventory[i]["stock"] -= qty
            _inventory[i]["sold"]  += qty
            total = qty * item["price"]
            return {"sold": True, "total": total, "remaining_stock": _inventory[i]["stock"]}
    raise HTTPException(404, "Item not found")
