from pathlib import Path


def test_mirror_session_store_roundtrip(tmp_path):
    from core.mirror.session_store import MirrorSession, MirrorSessionStore

    store = MirrorSessionStore(base_path=tmp_path)
    session = MirrorSession(
        session_id="sess1",
        created_at=1.0,
        updated_at=1.0,
        cards=[{"skill_id": "S1", "card_number": 1}],
        responses={"S1": "YES"},
    )
    store.save(session)

    loaded = store.load("sess1")
    assert loaded is not None
    assert loaded.session_id == "sess1"
    assert loaded.responses["S1"] == "YES"
    assert loaded.cards[0]["skill_id"] == "S1"

