-- ─────────────────────────────────────────────────────────────────────────────
-- Seeds the official VSYC-26 final results (X, 1A, SBJ divisions) as a single
-- "Official Results Import" judge per division, transcribed from the event's
-- NYYL scoring sheet. Uses the is_official_import override (0022) so the
-- stored Tech Execution / Final Score values match the source sheet exactly,
-- including SBJ's below-cap top score and 1A's negative net-clicker scores.
--
-- Registration IDs are matched by name + division against real, paid
-- vsyc_registrations rows (verified 1:1, no ambiguous matches).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO vsyc_scores
  (registration_id, division, judge_name, judge_display_name, judge_user_id, is_official_import,
   tech_execution_raw, tech_execution_override, trick_presentation, performance_quality, musicality, routine_construction,
   stop_count, discard_count, detach_count, final_score_override, notes)
VALUES
  -- X Division
  ('9ec0b3be-7b86-4a86-a761-57a4e72abaf8','X','Official Results Import','Official Results Import',NULL,true,60.00,60.00,9.00,8.00,7.00,8.00,1,0,0,91.00,'Imported from official VSYC-26 NYYL results sheet'),
  ('0dc18d8c-06f2-4d5b-ac63-397973559a7a','X','Official Results Import','Official Results Import',NULL,true,38.93,38.93,6.00,5.00,6.00,6.00,2,0,0,59.93,'Imported from official VSYC-26 NYYL results sheet'),
  ('57b3dbdc-946a-4fd7-936b-09d3a7b8bef3','X','Official Results Import','Official Results Import',NULL,true,27.64,27.64,6.00,7.00,6.00,6.00,0,0,0,52.64,'Imported from official VSYC-26 NYYL results sheet'),
  ('9db9e916-d4b3-4354-aa06-32d9247cd6b4','X','Official Results Import','Official Results Import',NULL,true,14.77,14.77,6.00,7.00,6.00,7.00,0,0,0,40.77,'Imported from official VSYC-26 NYYL results sheet'),
  ('6533d367-9cf7-4b7c-9b57-6629a9229e2b','X','Official Results Import','Official Results Import',NULL,true,30.30,30.30,3.00,4.00,3.00,3.00,0,1,0,40.30,'Imported from official VSYC-26 NYYL results sheet'),
  ('dd8095a9-a7d1-4e01-ab31-1c5ee1043652','X','Official Results Import','Official Results Import',NULL,true,22.06,22.06,5.00,4.00,5.00,5.00,2,0,0,39.06,'Imported from official VSYC-26 NYYL results sheet'),
  ('b5f617a1-b285-4275-b6d4-8bd28dce8c87','X','Official Results Import','Official Results Import',NULL,true,6.05,6.05,4.00,5.00,5.00,5.00,0,0,0,25.05,'Imported from official VSYC-26 NYYL results sheet'),
  ('756245e8-ee93-4f3c-a910-0642fe81e724','X','Official Results Import','Official Results Import',NULL,true,13.34,13.34,2.00,3.00,2.00,3.00,3,0,0,20.34,'Imported from official VSYC-26 NYYL results sheet'),

  -- 1A Division
  ('e52c4299-6003-4118-8edd-1846a57e9430','1A','Official Results Import','Official Results Import',NULL,true,60.00,60.00,9.50,8.50,8.50,9.00,0,0,0,95.50,'Imported from official VSYC-26 NYYL results sheet'),
  ('1efde77b-5c06-4c9c-9db2-7cdaa3f77a99','1A','Official Results Import','Official Results Import',NULL,true,56.21,56.21,7.50,7.00,7.50,6.50,0,0,0,84.71,'Imported from official VSYC-26 NYYL results sheet'),
  ('20d18766-3ade-4020-b5bf-f5b4f1332401','1A','Official Results Import','Official Results Import',NULL,true,49.06,49.06,8.50,8.00,6.50,7.50,0,0,0,79.56,'Imported from official VSYC-26 NYYL results sheet'),
  ('5a11ef3e-8f51-4eb3-850f-da250cc19849','1A','Official Results Import','Official Results Import',NULL,true,45.71,45.71,8.50,8.00,7.50,7.50,1,0,0,76.21,'Imported from official VSYC-26 NYYL results sheet'),
  ('1ba288a0-529d-4a3f-878b-29b732b0b7f3','1A','Official Results Import','Official Results Import',NULL,true,38.90,38.90,9.00,8.00,8.50,9.00,0,0,0,73.40,'Imported from official VSYC-26 NYYL results sheet'),
  ('662f5f4b-e51e-4fba-987f-5dd67f5526e1','1A','Official Results Import','Official Results Import',NULL,true,43.15,43.15,8.50,7.50,5.00,7.00,0,0,0,71.15,'Imported from official VSYC-26 NYYL results sheet'),
  ('568c660e-beb6-4714-832a-2eba356ebb69','1A','Official Results Import','Official Results Import',NULL,true,36.68,36.68,7.50,7.50,6.00,7.50,0,0,0,65.18,'Imported from official VSYC-26 NYYL results sheet'),
  ('0dc18d8c-06f2-4d5b-ac63-397973559a7a','1A','Official Results Import','Official Results Import',NULL,true,33.65,33.65,6.50,6.50,4.50,6.00,0,0,0,57.15,'Imported from official VSYC-26 NYYL results sheet'),
  ('b8a70b05-03ed-4fb8-97a8-23df4dc422c2','1A','Official Results Import','Official Results Import',NULL,true,33.60,33.60,5.50,6.00,4.50,5.50,0,0,0,55.10,'Imported from official VSYC-26 NYYL results sheet'),
  ('0203d6f6-6c35-49a4-a7e0-354a5ed0620e','1A','Official Results Import','Official Results Import',NULL,true,29.49,29.49,6.00,6.50,4.50,6.00,0,0,0,52.49,'Imported from official VSYC-26 NYYL results sheet'),
  ('f76a32d1-11dd-4c4a-b836-26388033d7dd','1A','Official Results Import','Official Results Import',NULL,true,24.95,24.95,7.50,6.50,5.50,6.50,0,0,0,50.95,'Imported from official VSYC-26 NYYL results sheet'),
  ('1afce31b-48c2-4b08-9b27-6ef96fef53e3','1A','Official Results Import','Official Results Import',NULL,true,30.87,30.87,5.00,5.50,3.50,5.00,0,0,0,49.87,'Imported from official VSYC-26 NYYL results sheet'),
  ('4199d33a-447b-46df-937a-ad7efe853a07','1A','Official Results Import','Official Results Import',NULL,true,26.98,26.98,6.50,6.00,5.00,5.00,1,0,0,48.48,'Imported from official VSYC-26 NYYL results sheet'),
  ('b5f617a1-b285-4275-b6d4-8bd28dce8c87','1A','Official Results Import','Official Results Import',NULL,true,23.14,23.14,6.50,5.00,6.50,6.00,0,0,0,47.14,'Imported from official VSYC-26 NYYL results sheet'),
  ('af074194-649a-4414-b412-37561692bb73','1A','Official Results Import','Official Results Import',NULL,true,20.16,20.16,6.50,5.50,7.00,6.00,0,0,0,45.16,'Imported from official VSYC-26 NYYL results sheet'),
  ('3eb5ec30-50f7-4be4-8f04-3508d38c6c0d','1A','Official Results Import','Official Results Import',NULL,true,20.23,20.23,6.50,7.00,5.50,7.50,0,1,0,43.73,'Imported from official VSYC-26 NYYL results sheet'),
  ('9b27eb2b-73c7-4c43-82d3-e21a45896aa1','1A','Official Results Import','Official Results Import',NULL,true,17.63,17.63,5.50,5.50,6.50,6.00,0,0,0,41.13,'Imported from official VSYC-26 NYYL results sheet'),
  ('37d73092-33f3-406b-9807-5197b4825866','1A','Official Results Import','Official Results Import',NULL,true,13.99,13.99,5.50,5.00,4.00,4.50,1,0,0,31.99,'Imported from official VSYC-26 NYYL results sheet'),
  ('7f39dfc5-1b63-454c-935f-9733660f00e1','1A','Official Results Import','Official Results Import',NULL,true,17.06,17.06,5.00,3.50,3.00,4.00,0,1,0,29.56,'Imported from official VSYC-26 NYYL results sheet'),
  ('60d57b87-c373-493b-a1d9-075204696251','1A','Official Results Import','Official Results Import',NULL,true,11.28,11.28,5.00,4.00,4.00,5.00,0,0,0,29.28,'Imported from official VSYC-26 NYYL results sheet'),
  ('48643088-60a2-4ca4-a2d0-e591ce6227b4','1A','Official Results Import','Official Results Import',NULL,true,12.94,12.94,4.50,4.50,4.00,5.00,0,1,0,27.94,'Imported from official VSYC-26 NYYL results sheet'),
  ('ea651f42-7e2d-4dc3-ba4f-b6bd0da29cda','1A','Official Results Import','Official Results Import',NULL,true,12.38,12.38,4.00,4.00,4.00,4.50,1,0,0,27.88,'Imported from official VSYC-26 NYYL results sheet'),
  ('5fbad1a7-b782-4de4-81c7-fe8fa0337034','1A','Official Results Import','Official Results Import',NULL,true,8.29,8.29,5.50,5.50,4.00,5.00,1,0,0,27.29,'Imported from official VSYC-26 NYYL results sheet'),
  ('911833ca-d3d8-42e2-a39d-3be6ff00d2c8','1A','Official Results Import','Official Results Import',NULL,true,10.02,10.02,5.00,3.50,3.50,3.50,0,0,0,25.52,'Imported from official VSYC-26 NYYL results sheet'),
  ('6533d367-9cf7-4b7c-9b57-6629a9229e2b','1A','Official Results Import','Official Results Import',NULL,true,7.48,7.48,4.00,4.00,3.50,4.50,0,0,0,23.48,'Imported from official VSYC-26 NYYL results sheet'),
  ('048240b5-3c1f-41d1-ae64-c1b643ab4500','1A','Official Results Import','Official Results Import',NULL,true,5.29,5.29,4.50,3.50,4.00,5.50,1,0,0,21.79,'Imported from official VSYC-26 NYYL results sheet'),
  ('57b3dbdc-946a-4fd7-936b-09d3a7b8bef3','1A','Official Results Import','Official Results Import',NULL,true,-1.48,-1.48,5.00,3.00,3.50,4.00,1,0,0,13.02,'Imported from official VSYC-26 NYYL results sheet'),
  ('6c93fa60-0334-48e8-8682-4c49c854b762','1A','Official Results Import','Official Results Import',NULL,true,-2.08,-2.08,3.00,2.00,2.00,2.50,0,0,0,7.42,'Imported from official VSYC-26 NYYL results sheet'),
  ('d1569845-7a10-4270-bf7a-313251d0bb9f','1A','Official Results Import','Official Results Import',NULL,true,-0.91,-0.91,2.50,3.50,2.00,3.00,0,1,0,7.09,'Imported from official VSYC-26 NYYL results sheet'),
  ('0acf5842-996e-4c64-ae2e-edecfff0f226','1A','Official Results Import','Official Results Import',NULL,true,2.83,2.83,1.50,2.00,2.00,1.50,1,2,0,2.83,'Imported from official VSYC-26 NYYL results sheet'),
  ('ee8d6381-9f1f-4677-9890-0140510acd13','1A','Official Results Import','Official Results Import',NULL,true,-4.51,-4.51,2.00,2.00,2.00,1.50,2,1,0,-2.01,'Imported from official VSYC-26 NYYL results sheet'),
  ('f38b7f8c-8e67-4b59-b40e-772ff50d65a9','1A','Official Results Import','Official Results Import',NULL,true,-7.07,-7.07,2.50,2.50,2.00,2.50,2,1,0,-2.57,'Imported from official VSYC-26 NYYL results sheet'),

  -- SBJ Division (no deductions)
  ('e1a008e3-ef44-48e6-86c0-464736262ddb','SBJ','Official Results Import','Official Results Import',NULL,true,17.03,17.03,14.00,16.00,13.00,14.00,0,0,0,74.03,'Imported from official VSYC-26 NYYL results sheet'),
  ('b82e52c7-a2e3-424b-9120-7e530b6e978c','SBJ','Official Results Import','Official Results Import',NULL,true,19.62,19.62,13.00,13.00,14.00,12.00,0,0,0,71.62,'Imported from official VSYC-26 NYYL results sheet'),
  ('0f629b26-ceb9-403e-a121-9cb788ec3e6d','SBJ','Official Results Import','Official Results Import',NULL,true,13.52,13.52,10.00,12.00,13.00,11.00,0,0,0,59.52,'Imported from official VSYC-26 NYYL results sheet'),
  ('ff2efe49-3222-4934-8e58-bc00a7369cbc','SBJ','Official Results Import','Official Results Import',NULL,true,18.65,18.65,13.00,10.00,9.00,8.00,0,0,0,58.65,'Imported from official VSYC-26 NYYL results sheet'),
  ('a3fce993-7868-40a1-8801-ec83f1de2dfc','SBJ','Official Results Import','Official Results Import',NULL,true,14.91,14.91,9.00,9.00,10.00,12.00,0,0,0,54.91,'Imported from official VSYC-26 NYYL results sheet'),
  ('9b75e4cf-1c21-4958-8c80-69822f0a323d','SBJ','Official Results Import','Official Results Import',NULL,true,9.94,9.94,5.00,7.00,10.00,8.00,0,0,0,39.94,'Imported from official VSYC-26 NYYL results sheet'),
  ('2311900f-5e48-41fa-83dc-6aafbebb152c','SBJ','Official Results Import','Official Results Import',NULL,true,9.13,9.13,8.00,5.00,10.00,6.00,0,0,0,38.13,'Imported from official VSYC-26 NYYL results sheet'),
  ('a7dc5099-1b16-44ff-820f-61ed5064a535','SBJ','Official Results Import','Official Results Import',NULL,true,6.66,6.66,7.00,8.00,7.00,7.00,0,0,0,35.66,'Imported from official VSYC-26 NYYL results sheet'),
  ('94b08264-c3dd-43a6-93d4-1756c7ebfa7b','SBJ','Official Results Import','Official Results Import',NULL,true,4.39,4.39,6.00,9.00,10.00,6.00,0,0,0,35.39,'Imported from official VSYC-26 NYYL results sheet'),
  ('6ef08a07-e738-4615-81f3-a3fa5b007f66','SBJ','Official Results Import','Official Results Import',NULL,true,8.56,8.56,8.00,7.00,3.00,5.00,0,0,0,31.56,'Imported from official VSYC-26 NYYL results sheet'),
  ('c70b6d83-9766-41ca-b076-e53e4f990d3c','SBJ','Official Results Import','Official Results Import',NULL,true,7.09,7.09,6.00,6.00,5.00,6.00,0,0,0,30.09,'Imported from official VSYC-26 NYYL results sheet'),
  ('a48f4d26-5557-48d0-87a0-fdc6910d9640','SBJ','Official Results Import','Official Results Import',NULL,true,4.70,4.70,4.00,5.00,4.00,6.00,0,0,0,23.70,'Imported from official VSYC-26 NYYL results sheet'),
  ('b2967d52-4a7a-41ac-a1e5-a6fc56f8c3d1','SBJ','Official Results Import','Official Results Import',NULL,true,5.85,5.85,5.00,4.00,3.00,5.00,0,0,0,22.85,'Imported from official VSYC-26 NYYL results sheet'),
  ('4dfbb282-e9a4-4464-8166-e61f85899cc9','SBJ','Official Results Import','Official Results Import',NULL,true,1.81,1.81,4.00,4.00,5.00,2.00,0,0,0,16.81,'Imported from official VSYC-26 NYYL results sheet')
ON CONFLICT DO NOTHING;

UPDATE vsyc_event_flags SET value_bool = true, updated_at = now() WHERE key = 'results_published';
