import asyncio
import json
import sys

async def _recognize(audio_path):
    try:
        from shazamio import Shazam
        shazam = Shazam()
        result = await shazam.recognize(audio_path)
        if result and "track" in result:
            track = result["track"]
            return json.dumps({
                "success": True,
                "title": track.get("title", "Unknown"),
                "artist": track.get("subtitle", "Unknown"),
                "album": track.get("album", {}).get("name", "Unknown") if isinstance(track.get("album"), dict) else "Unknown",
                "coverUrl": track.get("images", {}).get("coverart", "") if isinstance(track.get("images"), dict) else "",
                "genre": track.get("genres", {}).get("primary", {}).get("name", "") if isinstance(track.get("genres"), dict) else "",
                "releaseDate": track.get("release_date", ""),
                "shazamUrl": track.get("shazam_url", ""),
            })
        return json.dumps({"success": False, "error": "No track identified"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})

def recognize(audio_path):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(_recognize(audio_path))
        return result
    finally:
        loop.close()