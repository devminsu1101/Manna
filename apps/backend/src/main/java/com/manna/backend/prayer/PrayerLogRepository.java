package com.manna.backend.prayer;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface PrayerLogRepository extends JpaRepository<PrayerLog, Integer> {

    /**
     * 기도했어요. 같은 날 두 번이면 UNIQUE에 걸리는데, 그걸 성공으로 친다(멱등, 명세).
     * 예외로 받으면 트랜잭션이 rollback-only가 되므로 SQL에서 삼킨다.
     */
    @Modifying
    @Query(
        nativeQuery = true,
        value =
            "INSERT INTO prayer_logs (prayed_for_user_id, pray_by, prayed_on)"
                + " VALUES (:prayedFor, :prayBy, :day) ON CONFLICT DO NOTHING")
    void record(Integer prayedFor, Integer prayBy, LocalDate day);

    /** 그날 나를 위해 기도한 사람 수(D-901). 누군지는 내보내지 않는다(D-902). */
    long countByPrayedFor_IdAndPrayedOn(Integer prayedForId, LocalDate prayedOn);

    /** 내가 각 사람을 마지막으로 기도한 날. 정렬 키 1·3(D-1909)이 여기서 나온다. */
    @Query(
        "select l.prayedFor.id, max(l.prayedOn) from PrayerLog l"
            + " where l.prayBy.id = :prayBy and l.prayedFor.id in :prayedForIds"
            + " group by l.prayedFor.id")
    List<Object[]> lastPrayedBy(Integer prayBy, Collection<Integer> prayedForIds);
}
