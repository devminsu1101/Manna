package com.manna.backend.update;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;

public interface UpdatePostRepository extends JpaRepository<UpdatePost, Integer> {
    List<UpdatePost> findByPublishedAtIsNotNullOrderByPublishedAtDescIdDesc();
    List<UpdatePost> findAllByOrderByCreatedAtDescIdDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from UpdatePost p where p.id = :id")
    Optional<UpdatePost> findForUpdate(Integer id);
}
